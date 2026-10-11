import { PayloadEncoder } from './encoding';
import initialPPOWeights from './ppo-weights.json';

export interface PPOModelProfile {
	updateCount: number;
	lastTrained: string;
	actorWeights: number[][];
	criticWeights: number[];
}

export interface PPOWeightsFile {
	version: number;
	updatedAt: string;
	totalUpdates: number;
	profiles: Record<string, PPOModelProfile>;
}

type MutationAction = {
	id: string;
	label: string;
	mutate: (payload: string, state: PayloadState) => string;
};

export interface PayloadState {
	length: number;
	normalizedLength: number;
	tokenCount: number;
	keywordCount: number;
	operatorCount: number;
	quoteCount: number;
	angleBracketCount: number;
	encodedRatio: number;
	commentCount: number;
	categoryHint: number;
}

export interface SemanticValidationResult {
	valid: boolean;
	penalty: number;
	reasons: string[];
	bloatRatio: number;
}

export interface AdaptiveMutationDecision {
	originalPayload: string;
	payload: string;
	action: string;
	actionLabel: string;
	actionIndex: number;
	oldProbability: number;
	state: PayloadState;
	stateVector: number[];
	validation: SemanticValidationResult;
}

export interface AdaptiveMutationUpdate {
	reward: number;
	statusReward: number;
	constraintPenalty: number;
	bloatPenalty: number;
	updatedProbability: number;
	valueEstimate: number;
	advantage: number;
}

const SQL_KEYWORDS = [
	'union',
	'select',
	'from',
	'where',
	'and',
	'or',
	'insert',
	'update',
	'delete',
	'drop',
	'script',
	'alert',
];

const MAX_PAYLOAD_LENGTH = 2048;
const MAX_BLOAT_RATIO = 6;
const FEATURE_SIZE = 10;

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

function countMatches(payload: string, pattern: RegExp): number {
	return payload.match(pattern)?.length || 0;
}

function splitKeywordsWithComments(payload: string): string {
	let mutated = payload;
	for (const keyword of SQL_KEYWORDS) {
		const midpoint = Math.max(1, Math.floor(keyword.length / 2));
		const split = `${keyword.slice(0, midpoint)}/**/${keyword.slice(midpoint)}`;
		mutated = mutated.replace(new RegExp(keyword, 'gi'), split);
	}
	return mutated;
}

function insertInlineComment(payload: string): string {
	if (/\s/.test(payload)) return payload.replace(/\s+/, '/**/');
	const match = payload.match(/[a-z]{4,}/i);
	if (!match || match.index === undefined) return payload;
	const midpoint = match.index + Math.floor(match[0].length / 2);
	return `${payload.slice(0, midpoint)}/**/${payload.slice(midpoint)}`;
}

function tokenize(payload: string): string[] {
	return payload
		.split(/([^a-z0-9_]+|\s+)/i)
		.map((token) => token.trim())
		.filter(Boolean);
}

function stableMutation(original: string, mutated: string): string {
	if (!mutated || mutated.trim() === '') return original;
	return mutated;
}

function softmax(values: number[]): number[] {
	const max = Math.max(...values);
	const exp = values.map((value) => Math.exp(value - max));
	const sum = exp.reduce((total, value) => total + value, 0) || 1;
	return exp.map((value) => value / sum);
}

const MUTATION_ACTIONS: MutationAction[] = [
	{
		id: 'identity',
		label: 'Baseline',
		mutate: (payload) => payload,
	},
	{
		id: 'url_encode',
		label: 'URL encode',
		mutate: (payload) => encodeURIComponent(payload),
	},
	{
		id: 'double_url_encode',
		label: 'Double URL encode',
		mutate: (payload) => PayloadEncoder.doubleUrlEncode(payload),
	},
	{
		id: 'mixed_case',
		label: 'Mixed case',
		mutate: (payload) => PayloadEncoder.mixedCaseEncode(payload),
	},
	{
		id: 'html_entity',
		label: 'HTML entity encode',
		mutate: (payload) => PayloadEncoder.htmlEntityEncode(payload, true),
	},
	{
		id: 'unicode_escape',
		label: 'Unicode escape',
		mutate: (payload) => PayloadEncoder.unicodeEncode(payload),
	},
	{
		id: 'tab_spacing',
		label: 'Tab spacing',
		mutate: (payload) => payload.replace(/\s+/g, '%09'),
	},
	{
		id: 'comment_spacing',
		label: 'Comment spacing',
		mutate: (payload) => payload.replace(/\s+/g, '/**/'),
	},
	{
		id: 'keyword_split',
		label: 'Keyword split',
		mutate: splitKeywordsWithComments,
	},
	{
		id: 'inline_comment',
		label: 'Inline comment',
		mutate: insertInlineComment,
	},
	{
		id: 'quote_unicode',
		label: 'Quote unicode',
		mutate: (payload) => payload.replace(/'/g, '\\u0027').replace(/"/g, '\\u0022'),
	},
	{
		id: 'space_plus',
		label: 'Plus spacing',
		mutate: (payload) => payload.replace(/\s+/g, '+'),
	},
	{
		id: 'multi_whitespace',
		label: 'Multi-whitespace (%0c/%0a)',
		mutate: (payload) => payload.replace(/\s+/g, (m, offset) => (offset % 2 === 0 ? '%0c' : '%0a')),
	},
	{
		id: 'null_byte',
		label: 'Null-byte evasion',
		mutate: (payload) => (payload.includes('%00') ? payload : payload.replace(/(\b[a-zA-Z0-9_-]+)(?=[ '";<]|$)/g, '$1%00')),
	},
	{
		id: 'case_url_mix',
		label: 'Mid-word URL mix',
		mutate: (payload) =>
			payload.replace(/(select|union|script|alert|exec|where|from|order|group)/gi, (kw) =>
				kw
					.split('')
					.map((c, i) => (i === 1 ? `%${c.charCodeAt(0).toString(16)}` : i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()))
					.join(''),
			),
	},
	{
		id: 'hex_encode',
		label: 'Hex string literal',
		mutate: (payload) =>
			payload.replace(/'([^'\s]+)'/g, (_, s) => '0x' + [...s].map((c) => c.charCodeAt(0).toString(16)).join('')),
	},
];

// =============================================
// PERSISTENT PPO WEIGHTS REGISTRY (Shared between friends via ppo-weights.json)
// =============================================
class PPOWeightsManager {
	private data: PPOWeightsFile;

	constructor() {
		this.data = this.cloneWeights(initialPPOWeights as PPOWeightsFile);
	}

	private cloneWeights(src: PPOWeightsFile): PPOWeightsFile {
		const profiles: Record<string, PPOModelProfile> = {};
		for (const [key, p] of Object.entries(src?.profiles || {})) {
			profiles[key] = {
				updateCount: p.updateCount || 0,
				lastTrained: p.lastTrained || new Date().toISOString(),
				actorWeights: (p.actorWeights || []).map((row) => [...row]),
				criticWeights: [...(p.criticWeights || [])],
			};
		}
		return {
			version: src?.version || 1,
			updatedAt: src?.updatedAt || new Date().toISOString(),
			totalUpdates: src?.totalUpdates || 0,
			profiles,
		};
	}

	getWeightsForWAF(wafType?: string): { actorWeights: number[][]; criticWeights: number[] } {
		const key = wafType && this.data.profiles[wafType] ? wafType : 'default';
		const profile = this.data.profiles[key] || this.data.profiles['default'];
		if (profile && profile.actorWeights && profile.criticWeights) {
			return {
				actorWeights: profile.actorWeights.map((row) => [...row]),
				criticWeights: [...profile.criticWeights],
			};
		}
		return {
			actorWeights: MUTATION_ACTIONS.map((_, actionIndex) =>
				Array.from({ length: FEATURE_SIZE }, (_, featureIndex) => (actionIndex === 0 && featureIndex === 0 ? 0.08 : 0)),
			),
			criticWeights: Array.from({ length: FEATURE_SIZE }, () => 0),
		};
	}

	saveTrainedWeights(wafType: string | undefined, trainedWeights: { actorWeights: number[][]; criticWeights: number[] }, updateCount: number): void {
		const key = wafType && wafType !== 'Unknown' ? wafType : 'default';
		if (!this.data.profiles[key]) {
			this.data.profiles[key] = {
				updateCount: 0,
				lastTrained: new Date().toISOString(),
				actorWeights: trainedWeights.actorWeights.map((row) => [...row]),
				criticWeights: [...trainedWeights.criticWeights],
			};
		} else {
			this.data.profiles[key].actorWeights = trainedWeights.actorWeights.map((row) => [...row]);
			this.data.profiles[key].criticWeights = [...trainedWeights.criticWeights];
			this.data.profiles[key].updateCount += updateCount;
			this.data.profiles[key].lastTrained = new Date().toISOString();
		}

		this.data.totalUpdates += updateCount;
		this.data.updatedAt = new Date().toISOString();
	}

	getAllWeights(): PPOWeightsFile {
		return this.data;
	}

	importWeights(incoming: PPOWeightsFile): void {
		if (!incoming || !incoming.profiles) return;
		for (const [key, p] of Object.entries(incoming.profiles)) {
			this.data.profiles[key] = {
				updateCount: p.updateCount || 0,
				lastTrained: p.lastTrained || new Date().toISOString(),
				actorWeights: (p.actorWeights || []).map((row) => [...row]),
				criticWeights: [...(p.criticWeights || [])],
			};
		}
		this.data.totalUpdates = incoming.totalUpdates || this.data.totalUpdates;
		this.data.updatedAt = new Date().toISOString();
	}

	resetToDefaults(): void {
		this.data = this.cloneWeights(initialPPOWeights as PPOWeightsFile);
	}
}

export const ppoWeightsManager = new PPOWeightsManager();

export class AdaptivePPOPayloadMutator {
	private actorWeights: number[][];
	private criticWeights: number[];
	private readonly actorLearningRate = 0.08;
	private readonly criticLearningRate = 0.1;
	private readonly clipRange = 0.2;
	private readonly entropyWeight = 0.004;
	private readonly constraintWeight = 0.7;
	private readonly bloatWeight = 0.45;
	public sessionUpdates = 0;

	constructor(
		private readonly falsePositiveMode: boolean = false,
		public readonly wafType?: string,
		initialWeights?: { actorWeights?: number[][]; criticWeights?: number[] },
	) {
		const base = initialWeights || ppoWeightsManager.getWeightsForWAF(wafType);
		if (base?.actorWeights && base.actorWeights.length === MUTATION_ACTIONS.length) {
			this.actorWeights = base.actorWeights.map((row) => [...row]);
		} else {
			this.actorWeights = MUTATION_ACTIONS.map((_, actionIndex) =>
				Array.from({ length: FEATURE_SIZE }, (_, featureIndex) => (actionIndex === 0 && featureIndex === 0 ? 0.08 : 0)),
			);
		}

		if (base?.criticWeights && base.criticWeights.length === FEATURE_SIZE) {
			this.criticWeights = [...base.criticWeights];
		} else {
			this.criticWeights = Array.from({ length: FEATURE_SIZE }, () => 0);
		}
	}

	mutate(payload: string, category: string = ''): AdaptiveMutationDecision {
		const state = this.buildState(payload, category);
		const stateVector = this.vectorizeState(state);
		const probabilities = this.getPolicy(stateVector);
		const actionIndex = this.sampleAction(probabilities);
		const action = MUTATION_ACTIONS[actionIndex];
		const mutated = stableMutation(payload, action.mutate(payload, state));
		const validation = this.validateMutation(payload, mutated);
		const finalPayload = validation.valid ? mutated : payload;

		return {
			originalPayload: payload,
			payload: finalPayload,
			action: action.id,
			actionLabel: validation.valid ? action.label : `${action.label} rejected`,
			actionIndex,
			oldProbability: probabilities[actionIndex] || 1 / MUTATION_ACTIONS.length,
			state,
			stateVector,
			validation,
		};
	}

	update(decision: AdaptiveMutationDecision, status: number | string): AdaptiveMutationUpdate {
		const statusReward = this.rewardForStatus(status);
		const constraintPenalty = decision.validation.penalty * this.constraintWeight;
		const bloatPenalty = Math.max(0, decision.validation.bloatRatio - 1) * this.bloatWeight;
		const reward = clamp(statusReward - constraintPenalty - bloatPenalty, -1.5, 1.5);
		const valueEstimate = this.value(decision.stateVector);
		const advantage = reward - valueEstimate;
		const probabilities = this.getPolicy(decision.stateVector);
		const currentProbability = probabilities[decision.actionIndex] || decision.oldProbability;
		const ratio = currentProbability / Math.max(decision.oldProbability, 0.0001);
		const clippedRatio = clamp(ratio, 1 - this.clipRange, 1 + this.clipRange);
		const policyScale = advantage >= 0
			? Math.min(ratio, clippedRatio) * advantage
			: Math.max(ratio, clippedRatio) * advantage;

		for (let actionIndex = 0; actionIndex < this.actorWeights.length; actionIndex++) {
			const indicator = actionIndex === decision.actionIndex ? 1 : 0;
			const entropyNudge = -Math.log(Math.max(probabilities[actionIndex], 0.0001)) - 1;
			for (let featureIndex = 0; featureIndex < FEATURE_SIZE; featureIndex++) {
				const gradient = (indicator - probabilities[actionIndex]) * decision.stateVector[featureIndex];
				this.actorWeights[actionIndex][featureIndex] +=
					this.actorLearningRate * policyScale * gradient +
					this.entropyWeight * entropyNudge * decision.stateVector[featureIndex];
				this.actorWeights[actionIndex][featureIndex] = clamp(this.actorWeights[actionIndex][featureIndex], -5, 5);
			}
		}

		for (let featureIndex = 0; featureIndex < FEATURE_SIZE; featureIndex++) {
			this.criticWeights[featureIndex] += this.criticLearningRate * advantage * decision.stateVector[featureIndex];
			this.criticWeights[featureIndex] = clamp(this.criticWeights[featureIndex], -5, 5);
		}

		this.sessionUpdates++;
		const updatedProbability = this.getPolicy(decision.stateVector)[decision.actionIndex] || currentProbability;
		const updatedValue = this.value(decision.stateVector);

		return {
			reward,
			statusReward,
			constraintPenalty,
			bloatPenalty,
			updatedProbability,
			valueEstimate: updatedValue,
			advantage,
		};
	}

	exportWeights(): { actorWeights: number[][]; criticWeights: number[]; sessionUpdates: number } {
		return {
			actorWeights: this.actorWeights.map((row) => [...row]),
			criticWeights: [...this.criticWeights],
			sessionUpdates: this.sessionUpdates,
		};
	}

	persistToManager(): void {
		if (this.sessionUpdates > 0) {
			ppoWeightsManager.saveTrainedWeights(this.wafType, this.exportWeights(), this.sessionUpdates);
		}
	}

	private buildState(payload: string, category: string): PayloadState {
		const tokens = tokenize(payload);
		const lowered = payload.toLowerCase();
		const keywordCount = SQL_KEYWORDS.reduce((total, keyword) => total + countMatches(lowered, new RegExp(`\\b${keyword}\\b`, 'g')), 0);
		const encodedCount = countMatches(payload, /%[0-9a-f]{2}|\\u[0-9a-f]{4}|&#x?[0-9a-f]+;/gi);

		return {
			length: payload.length,
			normalizedLength: clamp(payload.length / 256, 0, 1),
			tokenCount: tokens.length,
			keywordCount,
			operatorCount: countMatches(payload, /(=|<|>|\bor\b|\band\b|\|\||&&)/gi),
			quoteCount: countMatches(payload, /['"`]/g),
			angleBracketCount: countMatches(payload, /[<>]/g),
			encodedRatio: clamp(encodedCount / Math.max(tokens.length, 1), 0, 1),
			commentCount: countMatches(payload, /\/\*|\*\/|--|#/g),
			categoryHint: category.toLowerCase().includes('xss') ? 1 : category.toLowerCase().includes('sql') ? -1 : 0,
		};
	}

	private vectorizeState(state: PayloadState): number[] {
		return [
			1,
			state.normalizedLength,
			clamp(state.tokenCount / 24, 0, 1),
			clamp(state.keywordCount / 8, 0, 1),
			clamp(state.operatorCount / 8, 0, 1),
			clamp(state.quoteCount / 8, 0, 1),
			clamp(state.angleBracketCount / 8, 0, 1),
			state.encodedRatio,
			clamp(state.commentCount / 8, 0, 1),
			state.categoryHint,
		];
	}

	private validateMutation(original: string, mutated: string): SemanticValidationResult {
		const reasons: string[] = [];
		const bloatRatio = mutated.length / Math.max(original.length, 1);

		if (mutated.length > MAX_PAYLOAD_LENGTH) reasons.push('max_length');
		if (bloatRatio > MAX_BLOAT_RATIO) reasons.push('bloat');
		if (countMatches(mutated, /\0/g) > 0) reasons.push('null_byte');
		if (countMatches(mutated, /[\r\n]/g) > 4) reasons.push('line_breaks');
		if (mutated.trim() === '') reasons.push('empty');

		const penalty = reasons.length > 0 ? 1 : 0;
		return {
			valid: reasons.length === 0,
			penalty,
			reasons,
			bloatRatio,
		};
	}

	private getPolicy(stateVector: number[]): number[] {
		const logits = this.actorWeights.map((weights) =>
			weights.reduce((total, weight, index) => total + weight * stateVector[index], 0),
		);
		return softmax(logits);
	}

	private value(stateVector: number[]): number {
		return this.criticWeights.reduce((total, weight, index) => total + weight * stateVector[index], 0);
	}

	private sampleAction(probabilities: number[]): number {
		const roll = Math.random();
		let cumulative = 0;
		for (let i = 0; i < probabilities.length; i++) {
			cumulative += probabilities[i];
			if (roll <= cumulative) return i;
		}
		return probabilities.length - 1;
	}

	private rewardForStatus(status: number | string): number {
		const code = typeof status === 'number' ? status : Number.parseInt(status, 10);
		if (!Number.isFinite(code)) return -0.2;

		if (this.falsePositiveMode) {
			if (code >= 200 && code < 300) return 1;
			if (code >= 300 && code < 400) return 0.2;
			if (code >= 400 && code < 500) return -1;
			if (code >= 500 && code < 600) return -0.4;
			return -0.2;
		}

		if (code >= 200 && code < 300) return 1;
		if (code >= 500 && code < 600) return 0.6;
		if (code >= 300 && code < 400) return 0.15;
		if (code >= 400 && code < 500) return -1;
		return -0.2;
	}
}

