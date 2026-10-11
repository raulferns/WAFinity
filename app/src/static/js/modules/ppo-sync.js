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
			<div class="p-2.5 bg-cyber-elevated/40 hover:bg-cyber-elevated/70 border border-white/[0.06] hover:border-white/[0.12] rounded-xl flex items-center justify-between transition-colors">
				<div class="flex items-center gap-2 min-w-0">
					<div class="w-2 h-2 rounded-full shrink-0 ${updates > 0 ? 'bg-cyber-accent animate-pulse' : 'bg-slate-500'}"></div>
					<div class="truncate">
						<span class="text-xs font-bold text-white font-mono">${escapeHtml(key)}</span>
						<span class="text-[10px] text-slate-400 ml-1.5">(${actionRows} acts)</span>
					</div>
				</div>
				<span class="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 border border-white/[0.08] text-cyber-accent font-semibold shrink-0">
					${updates} upd
				</span>
			</div>
		`;
	}

	content.innerHTML = `
		<div class="space-y-4">
			<!-- Overview Banner -->
			<div class="grid grid-cols-3 gap-2.5">
				<div class="p-3 bg-cyber-elevated/60 border border-white/[0.08] rounded-xl">
					<span class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-0.5">Model Version</span>
					<span class="text-sm font-bold text-white font-mono">v${ppoModalData.version || 1}</span>
				</div>
				<div class="p-3 bg-cyber-elevated/60 border border-white/[0.08] rounded-xl">
					<span class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-0.5">Total RL Updates</span>
					<span class="text-sm font-bold text-cyber-accent font-mono">${totalUpdates}</span>
				</div>
				<div class="p-3 bg-cyber-elevated/60 border border-white/[0.08] rounded-xl">
					<span class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-0.5">Last Updated</span>
					<span class="text-xs font-semibold text-slate-300 font-mono truncate block" title="${updatedAt}">${updatedAt}</span>
				</div>
			</div>

			<!-- Active WAF Profiles -->
			<div>
				<div class="flex items-center justify-between mb-2">
					<h4 class="text-xs font-bold text-slate-300 uppercase tracking-wider mb-0">Trained WAF Profiles</h4>
					<span class="text-[10px] text-slate-400 font-mono">${profileKeys.length} profiles</span>
				</div>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[290px] overflow-y-auto pr-1">
					${profilesListHtml}
				</div>
			</div>

			<!-- Terminal CLI Shortcut -->
			<div class="p-2.5 bg-black/40 border border-white/[0.08] rounded-xl flex items-center justify-between">
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
