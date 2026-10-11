/**
 * WAF-Checker - Scan History Module
 */

// =============================================
// FEATURE: Scan History (localStorage)
// =============================================
const SCAN_HISTORY_KEY = 'wafchecker_scan_history';
const SCAN_HISTORY_MAX = 30;

function saveScanToHistory(session) {
	if (!session || !session.url || !session.results || session.results.length === 0) return;

	const history = getScanHistory();
	const totalTests = session.results.length;
	const isFP = !!session.settings?.falsePositiveTest;
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
		id: session.id || `scan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
		url: session.url,
		timestamp: session.endTime || new Date().toISOString(),
		totalTests,
		bypassed,
		bypassRate,
		effectiveness,
		avgResponseTime: avgTime,
		minResponseTime: minTime,
		maxResponseTime: maxTime,
		falsePositiveTest: isFP,
		categories: [...new Set(session.results.map((r) => r.category))],
		methods: [...new Set(session.results.map((r) => r.method))],
		// Store full scan details so tapping on any history item reopens the exact results page
		results: session.results,
		settings: session.settings || {},
		wafDetection: session.wafDetection || null,
		startTime: session.startTime || null,
		endTime: session.endTime || null,
	};

	// Remove duplicate if same ID already exists
	const existingIdx = history.findIndex((h) => h.id === entry.id);
	if (existingIdx !== -1) {
		history.splice(existingIdx, 1);
	}

	history.unshift(entry);
	// Keep up to SCAN_HISTORY_MAX entries
	if (history.length > SCAN_HISTORY_MAX) history.length = SCAN_HISTORY_MAX;

	try {
		localStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(history));
	} catch (e) {
		console.warn('LocalStorage quota reached, trimming scan history...', e);
		while (history.length > 5) {
			history.pop();
			try {
				localStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(history));
				break;
			} catch (_) {}
		}
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

	if (typeof hideExportControls === 'function') {
		hideExportControls();
	}

	const esc = typeof escapeHtml === 'function' ? escapeHtml : (s) => String(s || '').replace(/</g, '&lt;');

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
					<h3 class="text-sm font-bold text-white mb-0.5">Scan History</h3>
					<p class="text-xs text-slate-400 mb-0">${history.length} scan${history.length !== 1 ? 's' : ''} recorded &bull; Tap any scan to view full results</p>
				</div>
			</div>
			${history.length > 0 ? `<button type="button" onclick="clearScanHistory()" class="px-3 py-1.5 bg-cyber-danger/10 border border-cyber-danger/30 rounded-lg text-xs text-cyber-danger font-bold hover:bg-cyber-danger/20 transition-all">Clear All</button>` : ''}
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

			html += `<div class="bg-cyber-card border border-white/[0.08] hover:border-cyber-accent/40 rounded-2xl p-4 transition-all cursor-pointer group hover:bg-[#181923]" onclick="openHistoryScan('${scan.id}')">
				<div class="flex items-center justify-between mb-3">
					<div>
						<div class="text-sm font-bold text-white font-mono group-hover:text-cyber-accent transition-colors flex items-center gap-2 flex-wrap">
							<span>${esc(scan.url)}</span>
							<span class="text-[10px] text-cyber-accent font-sans font-semibold px-2 py-0.5 rounded-full bg-cyber-accent/10 border border-cyber-accent/20 opacity-0 group-hover:opacity-100 transition-opacity">View Results &rarr;</span>
						</div>
						<div class="text-[11px] text-slate-400 mt-0.5">${dateStr} at ${timeStr} ${scan.falsePositiveTest ? ' • <span class="text-amber-400 font-semibold">False Positive Test</span>' : ''}</div>
					</div>
					<div class="flex items-center gap-2">
						<span class="px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${riskColors[riskLevel]}">${riskLevel}</span>
						<button type="button" onclick="event.stopPropagation(); deleteHistoryScan('${scan.id}')" class="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all" title="Delete scan">
							<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
							</svg>
						</button>
					</div>
				</div>
				<div class="grid grid-cols-5 gap-2">
					<div class="text-center bg-[#12131a] rounded-xl p-2 border border-white/[0.04]">
						<div class="text-sm font-bold ${effColor} font-mono">${scan.effectiveness}%</div>
						<div class="text-[9px] text-slate-400 uppercase font-semibold">WAF Eff.</div>
					</div>
					<div class="text-center bg-[#12131a] rounded-xl p-2 border border-white/[0.04]">
						<div class="text-sm font-bold text-white font-mono">${scan.totalTests}</div>
						<div class="text-[9px] text-slate-400 uppercase font-semibold">Tests</div>
					</div>
					<div class="text-center bg-[#12131a] rounded-xl p-2 border border-white/[0.04]">
						<div class="text-sm font-bold ${scan.bypassed > 0 ? 'text-cyber-danger' : 'text-cyber-success'} font-mono">${scan.bypassed}</div>
						<div class="text-[9px] text-slate-400 uppercase font-semibold">${scan.falsePositiveTest ? 'False Pos.' : 'Bypassed'}</div>
					</div>
					<div class="text-center bg-[#12131a] rounded-xl p-2 border border-white/[0.04]">
						<div class="text-sm font-bold text-cyber-accent font-mono">${scan.avgResponseTime}ms</div>
						<div class="text-[9px] text-slate-400 uppercase font-semibold">Avg Time</div>
					</div>
					<div class="text-center bg-[#12131a] rounded-xl p-2 border border-white/[0.04]">
						<div class="text-sm font-bold text-slate-300 font-mono">${scan.categories ? scan.categories.length : 0}</div>
						<div class="text-[9px] text-slate-400 uppercase font-semibold">Categories</div>
					</div>
				</div>
			</div>`;
		}
		html += `</div>`;
	}

	html += `</div>`;
	resultsDiv.innerHTML = html;
}

function openHistoryScan(scanId) {
	const history = getScanHistory();
	const scan = history.find((s) => s.id === scanId);
	if (!scan) return;

	// Check if this scan has detailed results saved
	if (!scan.results || scan.results.length === 0) {
		const urlInput = document.getElementById('url');
		if (urlInput && scan.url) urlInput.value = scan.url;
		if (typeof showAlert === 'function') {
			showAlert(
				`This older scan does not have detailed test results stored. The target URL "${scan.url}" has been loaded into the input so you can run the test again.`,
				'Notice',
				'warning',
			);
		}
		return;
	}

	const falsePositiveMode = !!(scan.falsePositiveTest || scan.settings?.falsePositiveTest);

	// Reconstruct the full test session
	const session = {
		id: scan.id,
		url: scan.url,
		startTime: scan.startTime || scan.timestamp,
		endTime: scan.endTime || scan.timestamp,
		totalTests: scan.results.length,
		results: scan.results,
		wafDetection: scan.wafDetection || (scan.results[0]?.wafDetected ? { detected: true, wafType: scan.results[0].wafType } : null),
		settings: {
			methods: scan.methods || scan.settings?.methods || [],
			categories: scan.categories || scan.settings?.categories || [],
			followRedirect: !!scan.settings?.followRedirect,
			falsePositiveTest: falsePositiveMode,
			caseSensitiveTest: !!scan.settings?.caseSensitiveTest,
			enhancedPayloads: !!scan.settings?.enhancedPayloads,
			useAdvancedPayloads: !!scan.settings?.useAdvancedPayloads,
			autoDetectWAF: !!scan.settings?.autoDetectWAF,
			useEncodingVariations: !!scan.settings?.useEncodingVariations,
			httpManipulation: !!scan.settings?.httpManipulation,
			adaptiveMutation: !!scan.settings?.adaptiveMutation,
		},
	};

	// Set as global active session for exports and analytics
	window.currentTestSession = session;
	if (typeof currentTestSession !== 'undefined') {
		currentTestSession = session;
	}

	// Update sidebar target URL
	const urlInput = document.getElementById('url');
	if (urlInput && scan.url) {
		urlInput.value = scan.url;
	}

	// Render the exact same full report
	const resultsDiv = document.getElementById('results');
	if (resultsDiv && typeof renderReport === 'function') {
		resultsDiv.innerHTML = renderReport(session.results, falsePositiveMode);
		resultsDiv.scrollTop = 0;
	}

	// Highlight categories based on results
	if (typeof highlightCategoryCheckboxesByResults === 'function') {
		highlightCategoryCheckboxesByResults(session.results, falsePositiveMode);
	}

	// Show export controls (JSON, CSV, HTML, Analytics)
	if (typeof showExportControls === 'function') {
		showExportControls();
	}
}

function deleteHistoryScan(scanId) {
	let history = getScanHistory();
	history = history.filter((s) => s.id !== scanId);
	try {
		localStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(history));
	} catch (e) {
		console.error('Failed to update scan history:', e);
	}
	showScanHistory();
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
window.openHistoryScan = openHistoryScan;
window.deleteHistoryScan = deleteHistoryScan;
window.clearScanHistory = clearScanHistory;
