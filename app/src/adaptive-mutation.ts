import { PayloadEncoder } from './encoding';

export interface AdaptiveMutationDecision {
	originalPayload: string;
	payload: string;
	action: string;
	actionLabel: string;
	actionIndex: number;
	oldProbability: number;
}

export interface AdaptiveMutationUpdate {
	reward: number;
	updatedProbability: number;
	valueEstimate: number;
}

type MutationAction = {
	id: string;
	label: string;
	mutate: (payload: string) => string;
};

const SQL_KEYWORDS = ['union', 'select', 'from', 'where', 'and', 'or', 'insert', 'update', 'delete', 'drop', 'script'];

function splitKeywordsWithComments(payload: string): string {
	let mutated = payload;
	for (const keyword of SQL_KEYWORDS) {
		const midpoint = Math.max(1, Math.floor(keyword.length / 2));
		const split = `${keyword.slice(0, midpoint)}/**/${keyword.slice(midpoint)}`;
		mutated = mutated.replace(new RegExp(keyword, 'gi'), split);
	}
	return mutated;
}

function stableUniqueFallback(original: string, mutated: string): string {
	if (!mutated || mutated.trim() === '') return original;
	return mutated;
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
];

export class AdaptivePPOPayloadMutator {
	private logits: number[];
	private valueEstimate = 0;
	private readonly learningRate = 0.18;
	private readonly valueLearningRate = 0.12;
	private readonly clipRange = 0.2;
	private readonly entropyWeight = 0.01;

	constructor(private readonly falsePositiveMode: boolean = false) {
		this.logits = MUTATION_ACTIONS.map(() => 0);
	}

	mutate(payload: string): AdaptiveMutationDecision {
		const probabilities = this.getPolicy();
		const actionIndex = this.sampleAction(probabilities);
		const action = MUTATION_ACTIONS[actionIndex];
		const mutated = stableUniqueFallback(payload, action.mutate(payload));

		return {
			originalPayload: payload,
			payload: mutated,
			action: action.id,
			actionLabel: action.label,
			actionIndex,
			oldProbability: probabilities[actionIndex] || 1 / MUTATION_ACTIONS.length,
		};
	}

	update(decision: AdaptiveMutationDecision, status: number | string): AdaptiveMutationUpdate {
		const reward = this.rewardForStatus(status);
		const probabilities = this.getPolicy();
		const currentProbability = probabilities[decision.actionIndex] || decision.oldProbability;
		const ratio = currentProbability / Math.max(decision.oldProbability, 0.0001);
		const advantage = reward - this.valueEstimate;
		const clippedRatio = Math.max(1 - this.clipRange, Math.min(1 + this.clipRange, ratio));
		const policyScale = advantage >= 0
			? Math.min(ratio, clippedRatio) * advantage
			: Math.max(ratio, clippedRatio) * advantage;

		for (let i = 0; i < this.logits.length; i++) {
			const indicator = i === decision.actionIndex ? 1 : 0;
			const entropyNudge = -Math.log(Math.max(probabilities[i], 0.0001)) - 1;
			this.logits[i] += this.learningRate * policyScale * (indicator - probabilities[i]);
			this.logits[i] += this.entropyWeight * entropyNudge;
			this.logits[i] = Math.max(-6, Math.min(6, this.logits[i]));
		}

		this.valueEstimate += this.valueLearningRate * (reward - this.valueEstimate);
		const updatedProbability = this.getPolicy()[decision.actionIndex] || currentProbability;

		return {
			reward,
			updatedProbability,
			valueEstimate: this.valueEstimate,
		};
	}

	private getPolicy(): number[] {
		const maxLogit = Math.max(...this.logits);
		const exp = this.logits.map((logit) => Math.exp(logit - maxLogit));
		const sum = exp.reduce((total, value) => total + value, 0) || 1;
		return exp.map((value) => value / sum);
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

