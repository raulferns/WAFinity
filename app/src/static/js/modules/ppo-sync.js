/**
 * WAFinity - PPO Reinforcement Learning Sync Module
 * Enables 4-friend cross-PC model sharing and persistence via Git and JSON weights.
 */

let ppoModalData = null;

async function fetchPPOWeightsData() {
	try {
		const res = await fetch('/api/ppo-weights');
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		return await res.json();
	} catch (e) {
		console.error('[PPO Sync] Error fetching weights:', e);
		return null;
	}
}

async function showPPOModal() {
	const modal = document.getElementById('ppoModal');
	if (!modal) return;

	modal.style.display = 'flex';
	document.body.style.overflow = 'hidden';

	const content = document.getElementById('ppoModalContent');
	if (content) {
		content.innerHTML = `
			<div class="py-12 text-center">
				<div class="inline-block animate-spin w-8 h-8 border-2 border-cyber-accent border-t-transparent rounded-full mb-3"></div>
				<p class="text-xs text-slate-400">Loading PPO reinforcement learning profiles...</p>
			</div>
		`;
	}

	await refreshPPOModalUI();
}

function closePPOModal() {
	const modal = document.getElementById('ppoModal');
	if (modal) modal.style.display = 'none';
	document.body.style.overflow = '';
}

async function refreshPPOModalUI() {
	const content = document.getElementById('ppoModalContent');
	if (!content) return;

	ppoModalData = await fetchPPOWeightsData();
	if (!ppoModalData || !ppoModalData.profiles) {
		content.innerHTML = `
			<div class="p-6 text-center">
				<p class="text-sm text-cyber-danger font-semibold mb-2">Could not load PPO model weights</p>
				<p class="text-xs text-slate-400 mb-4">Please ensure the WAFinity server is active.</p>
				<button onclick="refreshPPOModalUI()" class="px-4 py-2 bg-cyber-elevated border border-white/10 rounded-xl text-xs font-semibold text-slate-200 hover:text-white">Retry</button>
			</div>
		`;
		return;
	}

	const profiles = ppoModalData.profiles || {};
	const profileKeys = Object.keys(profiles);
	const totalUpdates = profileKeys.reduce((sum, key) => sum + (profiles[key]?.totalUpdates || 0), 0);
	const updatedAt = ppoModalData.updatedAt ? new Date(ppoModalData.updatedAt).toLocaleString() : 'Baseline';

	let profilesListHtml = '';
	for (const key of profileKeys) {
		const prof = profiles[key];
		const updates = prof.totalUpdates || 0;
		const actionRows = prof.actorWeights?.length || 0;
		profilesListHtml += `
			<div class="p-3 bg-cyber-elevated/40 border border-white/[0.06] rounded-xl flex items-center justify-between">
				<div class="flex items-center gap-2.5">
					<div class="w-2 h-2 rounded-full ${updates > 0 ? 'bg-cyber-accent animate-pulse' : 'bg-slate-500'}"></div>
					<div>
						<span class="text-xs font-bold text-white font-mono">${escapeHtml(key)}</span>
						<span class="text-[10px] text-slate-400 ml-2">(${actionRows} actions)</span>
					</div>
				</div>
				<span class="text-[11px] font-mono px-2 py-0.5 rounded bg-black/40 border border-white/[0.08] text-cyber-accent font-semibold">
					${updates} updates
				</span>
			</div>
		`;
	}

	content.innerHTML = `
		<div class="space-y-5">
			<!-- Overview Banner -->
			<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
				<div class="p-3.5 bg-cyber-elevated/60 border border-white/[0.08] rounded-xl">
					<span class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">Model Version</span>
					<span class="text-sm font-bold text-white font-mono">v${ppoModalData.version || 1}</span>
				</div>
				<div class="p-3.5 bg-cyber-elevated/60 border border-white/[0.08] rounded-xl">
					<span class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">Total RL Updates</span>
					<span class="text-sm font-bold text-cyber-accent font-mono">${totalUpdates}</span>
				</div>
				<div class="p-3.5 bg-cyber-elevated/60 border border-white/[0.08] rounded-xl">
					<span class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">Last Updated</span>
					<span class="text-xs font-semibold text-slate-300 font-mono truncate block" title="${updatedAt}">${updatedAt}</span>
				</div>
			</div>

			<!-- 4 Friends Multi-PC Git Sync Explanation -->
			<div class="p-4 bg-gradient-to-r from-blue-950/30 via-cyber-card to-cyber-card border border-cyber-accent/20 rounded-2xl">
				<div class="flex items-center gap-2 mb-2">
					<svg class="w-4 h-4 text-cyber-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
					</svg>
					<h4 class="text-xs font-bold text-white uppercase tracking-wider mb-0">How 4 Friends Share PPO Training</h4>
				</div>
				<p class="text-[11px] text-slate-300 leading-relaxed mb-3">
					When anyone runs attack scans, WAFinity optimizes mutation weights via Proximal Policy Optimization. To share learned bypasses across your team:
				</p>
				<ol class="text-[11px] text-slate-300 space-y-1.5 list-decimal list-inside pl-1">
					<li>Run security tests on your PC to accumulate bypass mutations.</li>
					<li>Click <strong class="text-white">Save / Download Weights</strong> or run <code class="text-cyber-accent bg-black/40 px-1 py-0.5 rounded font-mono">npm run ppo:save</code>.</li>
					<li>Commit the file: <code class="text-slate-200 bg-black/40 px-1 py-0.5 rounded font-mono">git commit -am "sync ppo" && git push</code>.</li>
					<li>Your friends run <code class="text-emerald-400 bg-black/40 px-1 py-0.5 rounded font-mono">git pull</code> &mdash; WAFinity automatically boots with the collective bypass model!</li>
				</ol>
			</div>

			<!-- Active WAF Profiles -->
			<div>
				<div class="flex items-center justify-between mb-2">
					<h4 class="text-xs font-bold text-slate-300 uppercase tracking-wider mb-0">Trained WAF Profiles</h4>
					<span class="text-[10px] text-slate-400">${profileKeys.length} profiles</span>
				</div>
				<div class="space-y-2 max-h-40 overflow-y-auto pr-1">
					${profilesListHtml}
				</div>
			</div>

			<!-- Terminal CLI Shortcut -->
			<div class="p-3 bg-black/40 border border-white/[0.08] rounded-xl flex items-center justify-between">
				<div class="flex items-center gap-2 overflow-hidden">
					<span class="text-[10px] font-mono text-slate-500 select-none">$</span>
					<span class="text-xs font-mono text-slate-200 truncate">npm run ppo:save</span>
				</div>
				<button onclick="copyPPOCliCommand()" id="btnCopyPPOCli" class="shrink-0 px-2.5 py-1 bg-cyber-elevated hover:bg-cyber-elevated-hover border border-white/10 rounded-lg text-[11px] font-semibold text-slate-300 hover:text-white transition-all">
					Copy
				</button>
			</div>
		</div>
	`;
}

function copyPPOCliCommand() {
	const cmd = 'npm run ppo:save';
	navigator.clipboard.writeText(cmd).then(() => {
		const btn = document.getElementById('btnCopyPPOCli');
		if (btn) {
			const old = btn.textContent;
			btn.textContent = 'Copied!';
			btn.classList.add('text-cyber-accent');
			setTimeout(() => {
				btn.textContent = old;
				btn.classList.remove('text-cyber-accent');
			}, 1800);
		}
	}).catch(() => {
		if (typeof showAlert === 'function') {
			showAlert(`Run command in terminal:\n${cmd}`, 'CLI Command', 'info');
		}
	});
}

function downloadPPOWeights() {
	window.open('/api/ppo-weights?download=1', '_blank');
}

function triggerImportPPOWeights() {
	const fileInput = document.getElementById('ppoWeightsFileInput');
	if (fileInput) fileInput.click();
}

async function handlePPOWeightsFileSelected(event) {
	const file = event.target.files?.[0];
	if (!file) return;

	try {
		const text = await file.text();
		const parsed = JSON.parse(text);

		if (!parsed || !parsed.profiles || typeof parsed.profiles !== 'object') {
			throw new Error('Invalid format: File is missing "profiles" object.');
		}

		const res = await fetch('/api/ppo-weights', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				action: 'import',
				weights: parsed,
			}),
		});

		const result = await res.json();
		if (!res.ok) throw new Error(result.error || `HTTP ${res.status}`);

		await refreshPPOModalUI();
		if (typeof showAlert === 'function') {
			showAlert(`PPO weights imported successfully!\nActive profiles: ${result.profilesCount || Object.keys(parsed.profiles).length}`, 'Model Imported', 'success');
		}
	} catch (err) {
		if (typeof showAlert === 'function') {
			showAlert(`Failed to import weights:\n${err.message}`, 'Import Error', 'error');
		}
	} finally {
		event.target.value = '';
	}
}

async function resetPPOWeights() {
	if (typeof showConfirm === 'function') {
		const ok = await showConfirm(
			'Are you sure you want to reset all trained PPO bypass weights back to defaults? Learned mutations will revert to baseline.',
			'Reset PPO Model',
			'warning'
		);
		if (!ok) return;
	}

	try {
		const res = await fetch('/api/ppo-weights', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action: 'reset' }),
		});
		if (!res.ok) throw new Error(`HTTP ${res.status}`);

		await refreshPPOModalUI();
		if (typeof showAlert === 'function') {
			showAlert('PPO model weights have been reset to baseline defaults.', 'Reset Complete', 'success');
		}
	} catch (err) {
		if (typeof showAlert === 'function') {
			showAlert(`Failed to reset weights: ${err.message}`, 'Error', 'error');
		}
	}
}

// Global exports for inline HTML handlers
window.showPPOModal = showPPOModal;
window.closePPOModal = closePPOModal;
window.refreshPPOModalUI = refreshPPOModalUI;
window.downloadPPOWeights = downloadPPOWeights;
window.triggerImportPPOWeights = triggerImportPPOWeights;
window.handlePPOWeightsFileSelected = handlePPOWeightsFileSelected;
window.resetPPOWeights = resetPPOWeights;
window.copyPPOCliCommand = copyPPOCliCommand;
