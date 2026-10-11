/**
 * WAF-Checker - Scan History Module
 */

// =============================================
// FEATURE: Scan History (localStorage)
// =============================================
const SCAN_HISTORY_KEY = 'wafchecker_scan_history';
const SCAN_HISTORY_MAX = 50;

function saveScanToHistory(session) {
	if (!session || !session.url || !session.results || session.results.length === 0) return;

	const history = getScanHistory();
	const totalTests = session.results.length;
	const isFP = session.settings?.falsePositiveTest;
	const bypassed = session.results.filter((r) => {
		const s = parseInt(String(r.status), 10);
		const isErr = isNaN(s) || r.status === 'ERR' || r.status === 'Error';
		if (isFP) {
			return s === 403 || s === 406 || s === 429 || s === 444 || (s >= 500 && s < 600) || isErr;
		}
		return (s >= 200 && s < 300) || (s >= 500 && s < 600) || isErr;
	}).length;
	const bypassRate = totalTests > 0 ? Math.round((bypassed / totalTests) * 100) : 0;
	const effectiveness = Math.max(0, Math.min(100, 100 - bypassRate));

	// Response time stats
	let totalTime = 0,
		minTime = Infinity,
		maxTime = 0;
	for (const r of session.results) {
		const rt = r.responseTime || 0;
		totalTime += rt;
		if (rt < minTime) minTime = rt;
		if (rt > maxTime) maxTime = rt;
	}
	if (minTime === Infinity) minTime = 0;
	const avgTime = totalTests > 0 ? Math.round(totalTime / totalTests) : 0;

	const entry = {
		id: `scan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
		url: session.url,
		timestamp: new Date().toISOString(),
		totalTests,
		bypassed,
		bypassRate,
		effectiveness,
		avgResponseTime: avgTime,
		minResponseTime: minTime,
		maxResponseTime: maxTime,
		falsePositiveTest: isFP || false,
		categories: [...new Set(session.results.map((r) => r.category))],
		methods: [...new Set(session.results.map((r) => r.method))],
	};

	history.unshift(entry);
	// Keep only the latest N entries
	if (history.length > SCAN_HISTORY_MAX) history.length = SCAN_HISTORY_MAX;

	try {
		localStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(history));
	} catch (e) {
		console.error('Failed to save scan history:', e);
	}
}

function getScanHistory() {
	try {
		const stored = localStorage.getItem(SCAN_HISTORY_KEY);
		return stored ? JSON.parse(stored) : [];
	} catch {
		return [];
	}
}

function showScanHistory() {
	const history = getScanHistory();
	const resultsDiv = document.getElementById('results');

	let html = `<div class="p-4">
		<!-- Header -->
		<div class="flex items-center justify-between mb-4 p-4 bg-gray-500/10 border border-gray-500/30 rounded-xl">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 rounded-lg bg-gray-500/20 flex items-center justify-center">
					<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
					</svg>
				</div>
				<div>
					<h3 class="text-sm font-bold text-white">Scan History</h3>
					<p class="text-xs text-gray-400">${history.length} scan${history.length !== 1 ? 's' : ''} recorded</p>
				</div>
			</div>
			${history.length > 0 ? `<button onclick="clearScanHistory()" class="px-3 py-1.5 bg-cyber-danger/10 border border-cyber-danger/30 rounded-lg text-xs text-cyber-danger font-bold hover:bg-cyber-danger/20 transition-all">Clear All</button>` : ''}
		</div>`;

	if (history.length === 0) {
		html += `<div class="text-center py-16">
			<svg class="w-12 h-12 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
			</svg>
			<p class="text-gray-500 font-semibold">No scan history yet</p>
			<p class="text-gray-600 text-sm mt-1">Run your first security test to see results here.</p>
		</div>`;
	} else {
		html += `<div class="space-y-3">`;
		for (const scan of history) {
			const date = new Date(scan.timestamp);
			const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
			const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
			const effColor = scan.effectiveness >= 75 ? 'text-cyber-success' : scan.effectiveness >= 50 ? 'text-yellow-400' : 'text-cyber-danger';
			const riskLevel = scan.bypassRate > 75 ? 'Critical' : scan.bypassRate > 50 ? 'High' : scan.bypassRate > 25 ? 'Medium' : 'Low';
			const riskColors = {
				Critical: 'text-red-400 bg-red-500/10 border-red-500/30',
				High: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
				Medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
				Low: 'text-cyber-success bg-cyber-success/10 border-cyber-success/30',
			};

			html += `<div class="bg-cyber-card border border-cyber-accent/20 rounded-xl p-4 hover:border-cyber-accent/40 transition-all">
				<div class="flex items-center justify-between mb-3">
					<div>
						<div class="text-sm font-bold text-white font-mono">${escapeHtml(scan.url)}</div>
						<div class="text-[10px] text-gray-500">${dateStr} at ${timeStr}</div>
					</div>
					<span class="px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${riskColors[riskLevel]}">${riskLevel}</span>
				</div>
				<div class="grid grid-cols-5 gap-2">
					<div class="text-center">
						<div class="text-sm font-bold ${effColor} font-mono">${scan.effectiveness}%</div>
						<div class="text-[9px] text-gray-500 uppercase">WAF Eff.</div>
					</div>
					<div class="text-center">
						<div class="text-sm font-bold text-white font-mono">${scan.totalTests}</div>
						<div class="text-[9px] text-gray-500 uppercase">Tests</div>
					</div>
					<div class="text-center">
						<div class="text-sm font-bold ${scan.bypassed > 0 ? 'text-cyber-danger' : 'text-cyber-success'} font-mono">${scan.bypassed}</div>
						<div class="text-[9px] text-gray-500 uppercase">${scan.falsePositiveTest ? 'False Pos.' : 'Bypassed'}</div>
					</div>
					<div class="text-center">
						<div class="text-sm font-bold text-cyber-accent font-mono">${scan.avgResponseTime}ms</div>
						<div class="text-[9px] text-gray-500 uppercase">Avg Time</div>
					</div>
					<div class="text-center">
						<div class="text-sm font-bold text-gray-400 font-mono">${scan.categories.length}</div>
						<div class="text-[9px] text-gray-500 uppercase">Categories</div>
					</div>
				</div>
			</div>`;
		}
		html += `</div>`;
	}

	html += `</div>`;
	resultsDiv.innerHTML = html;
}

async function clearScanHistory() {
	const confirmed = await showConfirm('Clear all scan history? This cannot be undone.', 'Clear History', 'danger');
	if (!confirmed) return;
	localStorage.removeItem(SCAN_HISTORY_KEY);
	showScanHistory();
}


// Expose to window for global access
window.saveScanToHistory = saveScanToHistory;
window.getScanHistory = getScanHistory;
window.showScanHistory = showScanHistory;
window.clearScanHistory = clearScanHistory;
