#!/usr/bin/env node
/**
 * WAFinity - PPO RL Model Sync Script
 * 
 * Fetches the active reinforcement learning weights from the running local WAFinity
 * dev server (http://127.0.0.1:8787/api/ppo-weights) and saves them to src/ppo-weights.json.
 * 
 * Once saved to src/ppo-weights.json, simply git commit and push to share learned
 * bypass mutations across all 4 friends' PCs.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

const DEFAULT_URL = process.env.PPO_API_URL || 'http://127.0.0.1:8787/api/ppo-weights';
const TARGET_FILE = path.resolve(__dirname, '..', 'src', 'ppo-weights.json');

function fetchJson(urlStr) {
	return new Promise((resolve, reject) => {
		const parsed = new URL(urlStr);
		const req = http.get(parsed, (res) => {
			if (res.statusCode && res.statusCode >= 400) {
				return reject(new Error(`Server returned HTTP ${res.statusCode}: ${res.statusMessage}`));
			}
			let body = '';
			res.setEncoding('utf8');
			res.on('data', (chunk) => { body += chunk; });
			res.on('end', () => {
				try {
					const data = JSON.parse(body);
					resolve(data);
				} catch (err) {
					reject(new Error(`Failed to parse JSON response: ${err.message}`));
				}
			});
		});

		req.on('error', (err) => reject(err));
		req.setTimeout(5000, () => {
			req.destroy(new Error('Request timed out after 5000ms. Is WAFinity running?'));
		});
	});
}

async function main() {
	const apiUrl = process.argv[2] || DEFAULT_URL;
	console.log(`\x1b[36m[WAFinity PPO Sync]\x1b[0m Fetching trained weights from ${apiUrl}...`);

	try {
		const weightsData = await fetchJson(apiUrl);

		if (!weightsData || typeof weightsData !== 'object' || !weightsData.profiles) {
			throw new Error('Invalid weights payload received: missing "profiles" key.');
		}

		// Ensure directory exists
		fs.mkdirSync(path.dirname(TARGET_FILE), { recursive: true });

		const formattedJson = JSON.stringify(weightsData, null, 2) + '\n';
		fs.writeFileSync(TARGET_FILE, formattedJson, 'utf8');

		const profileKeys = Object.keys(weightsData.profiles || {});
		const totalUpdates = Object.values(weightsData.profiles || {}).reduce(
			(sum, p) => sum + (p.totalUpdates || 0),
			0
		);

		console.log(`\x1b[32m✔ SUCCESS:\x1b[0m PPO weights saved to \x1b[1m${path.relative(process.cwd(), TARGET_FILE)}\x1b[0m`);
		console.log(`   • Profiles saved : ${profileKeys.join(', ') || 'default'}`);
		console.log(`   • Total updates  : ${totalUpdates}`);
		console.log(`   • Version        : ${weightsData.version || 1}`);
		console.log(`   • Last updated   : ${weightsData.updatedAt || 'now'}\n`);
		console.log(`\x1b[33mTo share with friends:\x1b[0m`);
		console.log(`   git add src/ppo-weights.json`);
		console.log(`   git commit -m "sync: update PPO RL bypass weights"`);
		console.log(`   git push`);
	} catch (err) {
		console.error(`\x1b[31m✖ ERROR:\x1b[0m Could not fetch PPO weights.`);
		console.error(`   Details: ${err.message}`);
		console.error(`\n\x1b[33mTip:\x1b[0m Make sure your local WAFinity dev server is running first:`);
		console.error(`   npm run dev`);
		process.exit(1);
	}
}

main();
