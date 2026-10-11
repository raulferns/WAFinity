/**
 * WAF-Checker - Main Application Controller
 */


function renderAnalyticsCards(results, falsePositiveMode = false) {
	if (!results || !results.length) return '';

	const totalTests = results.length;
	const bypassedTests = results.filter((r) => {
		const s = parseInt(String(r.status), 10);
		const isErr = isNaN(s) || r.status === 'ERR' || r.status === 'Error';
		if (falsePositiveMode) {
			return s === 403 || s === 406 || s === 429 || s === 444 || (s >= 500 && s < 600) || isErr;
		}
		return (s >= 200 && s < 300) || (s >= 500 && s < 600) || isErr;
	}).length;
	const bypassRate = totalTests > 0 ? (bypassedTests / totalTests) * 100 : 0;
	const wafEffectiveness = Math.max(0, Math.min(100, Math.round(100 - bypassRate)));

	// Response time stats
	let totalTime = 0,
		slowCount = 0,
		minTime = Infinity,
		maxTime = 0;
	for (const r of results) {
		const rt = r.responseTime || 0;
		totalTime += rt;
		if (rt >= SLOW_RESPONSE_THRESHOLD) slowCount++;
		if (rt < minTime) minTime = rt;
		if (rt > maxTime) maxTime = rt;
	}
	const avgTime = Math.round(totalTime / totalTests);
	if (minTime === Infinity) minTime = 0;

	// Risk level
	let riskLevel;
	if (falsePositiveMode) {
		if (bypassRate > 30) riskLevel = 'Critical';
		else if (bypassRate > 10) riskLevel = 'High';
		else if (bypassRate > 0) riskLevel = 'Medium';
		else riskLevel = 'Low';
	} else {
		if (bypassRate > 40) riskLevel = 'Critical';
		else if (bypassRate > 15) riskLevel = 'High';
		else if (bypassRate > 0) riskLevel = 'Medium';
		else riskLevel = 'Low';
	}

	const riskTextColors = {
		Critical: 'text-red-500',
		High: 'text-amber-400',
		Medium: 'text-amber-400',
		Low: 'text-emerald-400',
	};
	const riskColor = riskTextColors[riskLevel] || 'text-emerald-400';

	// Avg time color
	let avgColor = 'text-slate-200';
	if (avgTime >= SLOW_RESPONSE_THRESHOLD) avgColor = 'text-red-500';
	else if (avgTime >= 1000) avgColor = 'text-amber-400';

	return `<div class="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-4">
		<div class="bg-[#13141c] border border-white/[0.08] rounded-xl p-3 text-center">
			<div class="text-xl font-bold text-white mb-0.5 font-mono tracking-tight">${totalTests}</div>
			<div class="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Total Tests</div>
		</div>
		<div class="bg-[#13141c] border border-white/[0.08] rounded-xl p-3 text-center">
			<div class="text-xl font-bold ${bypassedTests > 0 ? 'text-red-500' : 'text-slate-200'} mb-0.5 font-mono tracking-tight">${bypassedTests}</div>
			<div class="text-[10px] text-slate-400 uppercase tracking-wider font-medium">${falsePositiveMode ? 'False Positives' : 'Bypassed'}</div>
		</div>
		<div class="bg-[#13141c] border border-white/[0.08] rounded-xl p-3 text-center">
			<div class="text-xl font-bold ${wafEffectiveness < 75 ? 'text-amber-400' : 'text-emerald-400'} mb-0.5 font-mono tracking-tight">${Math.round(wafEffectiveness)}%</div>
			<div class="text-[10px] text-slate-400 uppercase tracking-wider font-medium">${falsePositiveMode ? 'WAF Accuracy' : 'WAF Effectiveness'}</div>
		</div>
		<div class="bg-[#13141c] border border-white/[0.08] rounded-xl p-3 text-center">
			<div class="text-lg font-bold mb-0.5 font-mono tracking-tight ${riskColor}">${riskLevel}</div>
			<div class="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Risk Level</div>
		</div>
		<div class="bg-[#13141c] border border-white/[0.08] rounded-xl p-2.5 text-center">
			<div class="text-sm font-bold ${avgColor} font-mono tracking-tight">${avgTime}<span class="text-[9px] font-normal text-slate-500 ml-0.5">ms</span></div>
			<div class="text-[9px] text-slate-400 uppercase tracking-wider font-medium">Avg Response</div>
		</div>
		<div class="bg-[#13141c] border border-white/[0.08] rounded-xl p-2.5 text-center">
			<div class="text-sm font-bold text-slate-200 font-mono tracking-tight">${minTime}<span class="text-[9px] font-normal text-slate-500 ml-0.5">ms</span></div>
			<div class="text-[9px] text-slate-400 uppercase tracking-wider font-medium">Fastest</div>
		</div>
		<div class="bg-[#13141c] border border-white/[0.08] rounded-xl p-2.5 text-center">
			<div class="text-sm font-bold text-slate-200 font-mono tracking-tight">${maxTime}<span class="text-[9px] font-normal text-slate-500 ml-0.5">ms</span></div>
			<div class="text-[9px] text-slate-400 uppercase tracking-wider font-medium">Slowest</div>
		</div>
		<div class="bg-[#13141c] border border-white/[0.08] rounded-xl p-2.5 text-center">
			<div class="text-sm font-bold ${slowCount > 0 ? 'text-amber-400' : 'text-slate-500'} font-mono tracking-tight">${slowCount}</div>
			<div class="text-[9px] text-slate-400 uppercase tracking-wider font-medium">Slow (>${SLOW_RESPONSE_THRESHOLD / 1000}s)</div>
		</div>
	</div>`;
}

function renderSummary(results, falsePositiveMode = false) {
	if (!results || !results.length) return '';
	const statusCounter = {};
	let totalResponseTime = 0;
	let slowRequestCount = 0;
	let minTime = Infinity;
	let maxTime = 0;

	for (const r of results) {
		statusCounter[r.status] = (statusCounter[r.status] || 0) + 1;
		const rt = r.responseTime || 0;
		totalResponseTime += rt;
		if (rt >= SLOW_RESPONSE_THRESHOLD) slowRequestCount++;
		if (rt < minTime) minTime = rt;
		if (rt > maxTime) maxTime = rt;
	}

	const totalRequests = results.length;
	const avgTime = totalRequests > 0 ? Math.round(totalResponseTime / totalRequests) : 0;
	if (minTime === Infinity) minTime = 0;

	// Test analytics
	const bypassedTests = results.filter((r) => {
		const s = parseInt(String(r.status), 10);
		const isErr = isNaN(s) || r.status === 'ERR' || r.status === 'Error';
		if (falsePositiveMode) {
			return s === 403 || s === 406 || s === 429 || s === 444 || (s >= 500 && s < 600) || isErr;
		}
		return (s >= 200 && s < 300) || (s >= 500 && s < 600) || isErr;
	}).length;
	const bypassRate = totalRequests > 0 ? (bypassedTests / totalRequests) * 100 : 0;
	const wafEffectiveness = Math.max(0, Math.min(100, Math.round(100 - bypassRate)));
	let riskLevel;
	if (falsePositiveMode) {
		if (bypassRate > 30) riskLevel = 'Critical';
		else if (bypassRate > 10) riskLevel = 'High';
		else if (bypassRate > 0) riskLevel = 'Medium';
		else riskLevel = 'Low';
	} else {
		if (bypassRate > 40) riskLevel = 'Critical';
		else if (bypassRate > 15) riskLevel = 'High';
		else if (bypassRate > 0) riskLevel = 'Medium';
		else riskLevel = 'Low';
	}

	const riskTextColors = {
		Critical: 'text-red-500',
		High: 'text-amber-400',
		Medium: 'text-amber-400',
		Low: 'text-emerald-400',
	};
	const riskColor = riskTextColors[riskLevel] || 'text-emerald-400';

	// Avg time color
	let avgColor = 'text-slate-200';
	if (avgTime >= SLOW_RESPONSE_THRESHOLD) {
		avgColor = 'text-red-500';
	} else if (avgTime >= 1000) {
		avgColor = 'text-amber-400';
	}

	let html = `<div class="bg-cyber-card border border-white/[0.08] rounded-2xl p-4 mb-4 shadow-none">
		<div class="flex items-center justify-between mb-3">
			<h4 class="text-xs font-bold text-slate-300 uppercase tracking-wider mb-0">Results Summary</h4>
			<span class="text-xs text-slate-500 font-mono">${totalRequests} total tests</span>
		</div>

		<!-- Test Results + Response Time Stats -->
		<div class="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-2.5">
			<div class="p-3 rounded-xl bg-[#13141c] border border-white/[0.08] text-center">
				<div class="text-lg font-bold mb-0.5 font-mono tracking-tight ${riskColor}">${riskLevel}</div>
				<div class="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Risk Level</div>
			</div>
			<div class="p-3 rounded-xl bg-[#13141c] border border-white/[0.08] text-center">
				<div class="text-lg font-bold ${wafEffectiveness < 75 ? 'text-amber-400' : 'text-emerald-400'} font-mono tracking-tight mb-0.5">${Math.round(wafEffectiveness)}%</div>
				<div class="text-[10px] text-slate-400 uppercase tracking-wider font-medium">${falsePositiveMode ? 'WAF Accuracy' : 'WAF Effectiveness'}</div>
			</div>
			<div class="p-3 rounded-xl bg-[#13141c] border border-white/[0.08] text-center">
				<div class="text-lg font-bold text-white font-mono tracking-tight mb-0.5">${totalRequests}</div>
				<div class="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Total Tests</div>
			</div>
			<div class="p-3 rounded-xl bg-[#13141c] border border-white/[0.08] text-center">
				<div class="text-lg font-bold ${bypassedTests > 0 ? 'text-red-500' : 'text-slate-200'} font-mono tracking-tight mb-0.5">${bypassedTests}</div>
				<div class="text-[10px] text-slate-400 uppercase tracking-wider font-medium">${falsePositiveMode ? 'False Positives' : 'Bypassed'}</div>
			</div>
		</div>
		<div class="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
			<div class="p-2 rounded-xl bg-[#13141c] border border-white/[0.08] text-center">
				<div class="text-sm font-bold ${avgColor} font-mono tracking-tight">${avgTime}<span class="text-[9px] font-normal text-slate-500 ml-0.5">ms</span></div>
				<div class="text-[9px] text-slate-400 uppercase tracking-wider font-medium">Avg Response</div>
			</div>
			<div class="p-2 rounded-xl bg-[#13141c] border border-white/[0.08] text-center">
				<div class="text-sm font-bold text-slate-200 font-mono tracking-tight">${minTime}<span class="text-[9px] font-normal text-slate-500 ml-0.5">ms</span></div>
				<div class="text-[9px] text-slate-400 uppercase tracking-wider font-medium">Fastest</div>
			</div>
			<div class="p-2 rounded-xl bg-[#13141c] border border-white/[0.08] text-center">
				<div class="text-sm font-bold text-slate-200 font-mono tracking-tight">${maxTime}<span class="text-[9px] font-normal text-slate-500 ml-0.5">ms</span></div>
				<div class="text-[9px] text-slate-400 uppercase tracking-wider font-medium">Slowest</div>
			</div>
			<div class="p-2 rounded-xl bg-[#13141c] border border-white/[0.08] text-center">
				<div class="text-sm font-bold ${slowRequestCount > 0 ? 'text-amber-400' : 'text-slate-500'} font-mono tracking-tight">${slowRequestCount}</div>
				<div class="text-[9px] text-slate-400 uppercase tracking-wider font-medium">Slow (>${SLOW_RESPONSE_THRESHOLD / 1000}s)</div>
			</div>
		</div>

		<!-- Status Filter -->
		<h5 class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Filter by Status Code</h5>
		<div class="flex flex-wrap gap-2 items-center">
			<label class="inline-flex items-center gap-2 px-2.5 py-1.5 bg-[#13141c] hover:bg-[#181923] rounded-lg cursor-pointer transition-all border border-white/[0.08] hover:border-white/[0.18]">
				<input type="checkbox" id="statusSelectAll" checked class="w-3.5 h-3.5 accent-cyber-accent shrink-0" />
				<span class="text-xs font-semibold text-slate-200">All</span>
				<span class="px-1.5 py-0.5 bg-white/[0.06] text-slate-300 text-[10px] font-mono font-bold rounded">${totalRequests}</span>
			</label>`;

	const sortedCodes = Object.keys(statusCounter).sort();
	for (const code of sortedCodes) {
		const percent = totalRequests ? (statusCounter[code] / totalRequests) * 100 : 0;
		const codeNum = parseInt(code, 10);
		let dotColor = 'bg-slate-500';

		if (falsePositiveMode) {
			if (codeNum >= 200 && codeNum < 300) {
				dotColor = 'bg-emerald-400';
			} else if (codeNum === 403) {
				dotColor = 'bg-red-500';
			} else if (codeNum >= 300 && codeNum < 400) {
				dotColor = 'bg-amber-400';
			} else if (codeNum >= 400 && codeNum < 500) {
				dotColor = 'bg-amber-400';
			}
		} else {
			if (codeNum >= 400 && codeNum < 500) {
				dotColor = 'bg-emerald-400';
			} else if ((codeNum >= 200 && codeNum < 300) || (codeNum >= 500 && codeNum < 600)) {
				dotColor = 'bg-red-500';
			} else if (codeNum >= 300 && codeNum < 400) {
				dotColor = 'bg-amber-400';
			}
		}

		html += `
			<label class="inline-flex items-center gap-2 px-2.5 py-1.5 bg-[#13141c] hover:bg-[#181923] rounded-lg cursor-pointer transition-all border border-white/[0.08] hover:border-white/[0.18]">
				<input type="checkbox" class="status-filter-checkbox w-3.5 h-3.5 accent-cyber-accent shrink-0" data-status="${code}" checked />
				<span class="w-2 h-2 rounded-full ${dotColor} shrink-0"></span>
				<span class="text-xs font-mono font-semibold text-slate-200">${code}</span>
				<span class="text-[10px] font-mono text-slate-500">${percent.toFixed(0)}%</span>
				<span class="px-1.5 py-0.5 bg-white/[0.06] text-slate-300 text-[10px] font-mono font-bold rounded">${statusCounter[code]}</span>
			</label>`;
	}

	html += `</div></div>`;
	return html;
}

// Slow response threshold in ms
var SLOW_RESPONSE_THRESHOLD = window.SLOW_RESPONSE_THRESHOLD || 2000;

function renderResultRow(r, falsePositiveMode = false) {
	const statusStr = String(r.status);
	const isError = statusStr === 'ERR' || statusStr === 'error' || statusStr === 'Error';
	const codeNum = isError ? NaN : parseInt(statusStr, 10);
	let statusBg = 'bg-slate-500/10 border border-slate-500/25 text-slate-300';
	let payloadClass = 'payload-box-slate';
	let statusDisplay = r.status;
	let statusTooltip = '';

	if (isError || isNaN(codeNum)) {
		statusBg = 'bg-red-500/10 border border-red-500/25 text-red-500';
		payloadClass = 'payload-box-red';
	} else if (falsePositiveMode) {
		if (codeNum >= 200 && codeNum < 300) {
			statusBg = 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400';
			payloadClass = 'payload-box-green';
		} else if (codeNum === 403) {
			statusBg = 'bg-red-500/10 border border-red-500/25 text-red-500';
			payloadClass = 'payload-box-red';
		} else if (codeNum >= 300 && codeNum < 400) {
			statusBg = 'bg-amber-500/10 border border-amber-500/25 text-amber-400';
			payloadClass = 'payload-box-orange';
			statusTooltip = `title="Redirect (${codeNum}): The server redirected this request."`;
		} else if (codeNum >= 400 && codeNum < 500) {
			statusBg = 'bg-amber-500/10 border border-amber-500/25 text-amber-400';
			payloadClass = 'payload-box-orange';
		} else if (codeNum >= 500 && codeNum < 600) {
			statusBg = 'bg-red-500/10 border border-red-500/25 text-red-500';
			payloadClass = 'payload-box-red';
		}
	} else {
		// Normal Security Test:
		// 4xx = Blocked by WAF / Protected (GREEN)
		// 2xx or 5xx = Exploit succeeded / server failure = Vulnerable (RED)
		// 3xx = Redirect (AMBER)
		if (codeNum >= 400 && codeNum < 500) {
			statusBg = 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400';
			payloadClass = 'payload-box-green';
		} else if ((codeNum >= 200 && codeNum < 300) || (codeNum >= 500 && codeNum < 600)) {
			statusBg = 'bg-red-500/10 border border-red-500/25 text-red-500';
			payloadClass = 'payload-box-red';
		} else if (codeNum >= 300 && codeNum < 400) {
			statusBg = 'bg-amber-500/10 border border-amber-500/25 text-amber-400';
			payloadClass = 'payload-box-orange';
			statusTooltip = `title="Redirect (${codeNum}): The server redirected this request."`;
		}
	}

	const responseTime = r.responseTime || 0;
	const isSlow = responseTime >= SLOW_RESPONSE_THRESHOLD;
	const adaptiveHtml = r.adaptiveMutation
		? `<div class="mt-1 text-[10px] ${r.adaptiveMutation.valid === false ? 'text-amber-400' : 'text-cyber-accent'} font-mono">PPO: ${escapeHtml(r.adaptiveMutation.actionLabel || r.adaptiveMutation.action)} reward ${Number(r.adaptiveMutation.reward || 0).toFixed(2)}${r.adaptiveMutation.constraintPenalty ? `, penalty ${Number(r.adaptiveMutation.constraintPenalty).toFixed(2)}` : ''}</div>`
		: '';

	// Response time display with slow indicator
	let timeHtml;
	if (isSlow) {
		timeHtml = `<span class="text-amber-400 font-semibold font-mono">${responseTime}ms</span> <span class="inline-flex items-center ml-1 px-1.5 py-0.5 bg-amber-500/10 text-amber-400 text-[10px] font-mono font-bold rounded border border-amber-500/20" title="Response time exceeds ${SLOW_RESPONSE_THRESHOLD}ms">SLOW</span>`;
	} else {
		timeHtml = `<span class="text-slate-400 font-mono text-xs">${responseTime}ms</span>`;
	}

	return `
		<tr data-status="${r.status}" class="hover:bg-white/[0.02] transition-colors border-b border-white/[0.04]">
			<td class="px-4 py-2.5 text-xs text-slate-300 font-medium">${escapeHtml(r.category)}</td>
			<td class="px-4 py-2.5 text-center">
				<span class="px-2 py-0.5 bg-[#181923] border border-white/[0.08] text-slate-300 text-xs font-mono rounded font-medium">${r.method}</span>
			</td>
			<td class="px-4 py-2.5 text-center">
				<span class="px-2.5 py-0.5 ${statusBg} text-xs font-mono font-semibold rounded-md cursor-pointer hover:brightness-110 transition-all inline-block" onclick="showHttpCodesModal()" ${statusTooltip}>${statusDisplay}</span>
			</td>
			<td class="px-4 py-2.5 text-center whitespace-nowrap">${timeHtml}</td>
			<td class="px-4 py-2.5">
				<code class="text-xs font-mono ${payloadClass} px-2.5 py-1 rounded-md break-all select-all block leading-relaxed">${escapeHtml(r.payload)}</code>
				${adaptiveHtml}
			</td>
		</tr>`;
}

function renderReportHeader(falsePositiveMode = false) {
	let html = '';

	if (falsePositiveMode) {
		html += `<div class="flex items-center justify-between mb-4 p-4 bg-cyber-card border border-white/[0.08] rounded-2xl shadow-none">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 rounded-xl bg-cyber-elevated border border-white/[0.08] flex items-center justify-center text-slate-300">
					<svg class="w-5 h-5 text-cyber-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
					</svg>
				</div>
				<div>
					<h3 class="text-sm font-bold text-white tracking-tight">False Positive Test</h3>
					<p class="text-xs text-slate-400">Testing if legitimate traffic is being blocked by the WAF</p>
				</div>
			</div>
		</div>`;
	} else {
		html += `<div class="flex items-center justify-between mb-4 p-4 bg-cyber-card border border-white/[0.08] rounded-2xl shadow-none">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 rounded-xl bg-cyber-elevated border border-white/[0.08] flex items-center justify-center text-slate-300">
					<svg class="w-5 h-5 text-cyber-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
					</svg>
				</div>
				<div>
					<h3 class="text-sm font-bold text-white tracking-tight">Security Test In Progress...</h3>
					<p class="text-xs text-slate-400 font-mono" id="liveTestCounter">0 tests completed</p>
				</div>
			</div>
		</div>`;
	}

	// Live results table
	html += `<div class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden shadow-none">
		<div id="liveResultsScroller" class="overflow-x-auto" style="max-height: 70vh; overflow-y: auto;">
			<table class="w-full text-sm" id="resultsTable">
				<thead class="sticky top-0 z-10">
					<tr class="bg-[#13141c] border-b border-white/[0.08]">
						<th class="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</th>
						<th class="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Method</th>
						<th class="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
						<th class="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Time</th>
						<th class="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Payload</th>
					</tr>
				</thead>
				<tbody id="liveResultsBody" class="divide-y divide-white/[0.04]">
				</tbody>
			</table>
		</div>
	</div>`;

	return html;
}

function renderReport(results, falsePositiveMode = false) {
	if (!results || results.length === 0) return '';

	let html = '';

	const bypassedTests = results.filter((r) => {
		const s = parseInt(String(r.status), 10);
		if (falsePositiveMode) {
			return s === 403;
		}
		return s === 200 || s === 500;
	}).length;
	const isProtected = bypassedTests === 0;

	// Add visual indicator for test mode with explanation
	if (falsePositiveMode) {
		const fpStatusBadge = isProtected
			? `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 tracking-wide uppercase"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>Optimal (0 Blocked)</span>`
			: `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/10 border border-red-500/30 text-red-500 tracking-wide uppercase"><span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>Warning (${bypassedTests} False Positives)</span>`;
		const fpIconColor = isProtected ? 'text-emerald-400' : 'text-red-500';
		const fpIconBoxBg = isProtected ? 'bg-emerald-500/10 border-emerald-500/25' : 'bg-red-500/10 border-red-500/25';

		html += `<div class="flex items-center justify-between mb-4 p-4 bg-cyber-card border border-white/[0.08] rounded-2xl shadow-none flex-wrap gap-3">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 rounded-xl ${fpIconBoxBg} border flex items-center justify-center ${fpIconColor}">
					<svg class="w-5 h-5 ${fpIconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
					</svg>
				</div>
				<div>
					<div class="flex items-center gap-2.5">
						<h3 class="text-sm font-bold text-white tracking-tight">False Positive Test</h3>
						${fpStatusBadge}
					</div>
					<p class="text-xs text-slate-400">Testing if legitimate traffic is being blocked by the WAF</p>
				</div>
			</div>
			<div class="flex items-center gap-2 flex-wrap text-xs">
				<span class="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#181923] border border-white/[0.08] rounded-[10px] text-xs font-medium text-slate-300">
					<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
					<span>200 = Allowed (Green)</span>
				</span>
				<span class="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#181923] border border-white/[0.08] rounded-[10px] text-xs font-medium text-slate-300">
					<span class="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
					<span>403 = Blocked (Red)</span>
				</span>
				<span class="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#181923] border border-white/[0.08] rounded-[10px] text-xs font-medium text-slate-300">
					<span class="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
					<span>3xx = Redirect</span>
				</span>
				<button onclick="showHttpCodesModal('falsePositive')" class="px-3 py-1.5 bg-[#181923] hover:bg-[#20212d] border border-white/[0.08] hover:border-white/[0.18] rounded-[10px] text-slate-300 hover:text-white text-xs font-semibold transition-all shadow-none">
					Show all HTTP codes
				</button>
			</div>
		</div>
		<div class="mb-4 p-3.5 bg-[#13141c] border border-white/[0.08] rounded-xl">
			<p class="text-xs text-slate-400 leading-relaxed mb-0">
				<strong class="text-cyber-accent font-semibold">What is a False Positive Test?</strong> This test uses <strong class="text-slate-200">legitimate, safe payloads</strong> to check if your WAF is blocking normal traffic.
				If you see <strong class="text-red-500">403 (red)</strong>, it means legitimate requests are being blocked - this is a <strong class="text-red-500">false positive</strong> and should be investigated.
				<strong class="text-amber-400">Status 3xx (orange)</strong> means the server redirected the request. This could be a normal redirect or the WAF redirecting to a block page. Check the redirect location to determine if legitimate traffic is being redirected unnecessarily.
			</p>
		</div>`;
	} else {
		const statusBadge = isProtected
			? `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 tracking-wide uppercase"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>Protected</span>`
			: '';
		const iconColor = isProtected ? 'text-emerald-400' : 'text-red-500';
		const iconBoxBg = isProtected ? 'bg-emerald-500/10 border-emerald-500/25' : 'bg-red-500/10 border-red-500/25';

		html += `<div class="flex items-center justify-between mb-4 p-4 bg-cyber-card border border-white/[0.08] rounded-2xl shadow-none flex-wrap gap-3">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 rounded-xl ${iconBoxBg} border flex items-center justify-center ${iconColor}">
					<svg class="w-5 h-5 ${iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
					</svg>
				</div>
				<div>
					<div class="flex items-center gap-2.5">
						<h3 class="text-sm font-bold text-white tracking-tight">Security Test Complete</h3>
						${statusBadge}
					</div>
					<p class="text-xs text-slate-400">WAF protection analysis results</p>
				</div>
			</div>
			<div class="flex items-center gap-2 flex-wrap text-xs">
				<span class="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#181923] border border-white/[0.08] rounded-[10px] text-xs font-medium text-slate-300">
					<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
					<span>4xx = Protected (Green)</span>
				</span>
				<span class="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#181923] border border-white/[0.08] rounded-[10px] text-xs font-medium text-slate-300">
					<span class="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
					<span>200/500 = Vulnerable (Red)</span>
				</span>
				<span class="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#181923] border border-white/[0.08] rounded-[10px] text-xs font-medium text-slate-300">
					<span class="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
					<span>3xx = Redirect</span>
				</span>
				<button onclick="showHttpCodesModal('normal')" class="px-3 py-1.5 bg-[#181923] hover:bg-[#20212d] border border-white/[0.08] hover:border-white/[0.18] rounded-[10px] text-slate-300 hover:text-white text-xs font-semibold transition-all shadow-none">
					Show all HTTP codes
				</button>
			</div>
		</div>
		<div class="mb-4 p-3.5 bg-[#13141c] border border-white/[0.08] rounded-xl">
			<p class="text-xs text-slate-400 leading-relaxed mb-0">
				<strong class="text-slate-200 font-semibold">What are these tests?</strong> This test sends <strong class="text-slate-200">malicious payloads</strong> (SQL Injection, XSS, etc.) to check if your WAF blocks them.
				<strong class="text-emerald-400">Status 4xx (green)</strong> means the WAF detected and blocked the attack.
				<strong class="text-red-500">Status 200/500 (red)</strong> means the attack succeeded - your application is <strong class="text-red-500">vulnerable</strong> and the WAF did not protect it.
				<strong class="text-amber-400">Status 3xx (orange)</strong> means the server redirected the request. This could indicate the WAF is redirecting to a block page (good), or the server is redirecting normally (requires investigation). Check the redirect location to determine if it's a block page or a normal redirect.
			</p>
		</div>`;
	}

	// Add WAF detection info if available
	if (results.length > 0 && results[0].wafDetected) {
		html += `<div class="flex items-center gap-3 mb-4 p-3 bg-[#13141c] border border-white/[0.08] rounded-xl">
			<svg class="w-5 h-5 text-slate-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
			</svg>
			<span class="text-xs text-slate-300"><strong class="text-white font-semibold">WAF Detected:</strong> <span class="text-cyber-accent font-semibold">${results[0].wafType}</span></span>
			<span class="text-[10px] text-slate-500 font-mono uppercase tracking-wider">(Auto-detection)</span>
		</div>`;
	}

	html += renderSummary(results, falsePositiveMode);

	// Results table with modern design
	html += `<div class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden shadow-none">
		<div class="overflow-x-auto">
			<table class="w-full text-sm" id="resultsTable">
				<thead>
					<tr class="bg-[#13141c] border-b border-white/[0.08]">
						<th class="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</th>
						<th class="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Method</th>
						<th class="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
						<th class="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Time</th>
						<th class="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Payload</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-white/[0.04]">
`;

	for (const r of results) {
		html += renderResultRow(r, falsePositiveMode);
	}

	html += `</tbody></table></div></div>`;

	setTimeout(() => {
		filterResultsTableByStatus();
		const all = document.querySelectorAll('.status-filter-checkbox');
		const checkedCount = Array.from(all).filter((cb) => cb.checked).length;
		const selectAll = document.getElementById('statusSelectAll');
		if (selectAll) {
			selectAll.checked = checkedCount === all.length;
		}
	}, 0);
	return html;
}


// --- PAYLOAD CATEGORIES LOGIC ---
// Categories are loaded dynamically from GitHub via the backend
var PAYLOAD_CATEGORIES = [];
window.PAYLOAD_CATEGORIES = PAYLOAD_CATEGORIES;
let payloadCategoriesLoaded = false;
let payloadLoadRetries = 0;
const PAYLOAD_MAX_AUTO_RETRIES = 3;

async function loadPayloadCategories() {
	const container = document.getElementById('categoryCheckboxes');
	if (container) {
		container.innerHTML = `<div class="py-4" id="payloadLoadingIndicator">
			${cyberLoader({ size: 'sm', color: 'text-cyber-accent', text: 'Loading payloads from GitHub...', inline: true })}
		</div>`;
	}
	try {
		// Check loading status first
		const statusResp = await fetch('/api/payloads/status');
		const status = await statusResp.json();

		if (!status.loaded) {
			// Wait a bit and retry - backend is still loading from GitHub
			await new Promise((r) => setTimeout(r, 2000));
		}

		const resp = await fetch('/api/payloads');
		if (!resp.ok) throw new Error(`Failed to load payloads (HTTP ${resp.status})`);
		const data = await resp.json();

		if (!data || Object.keys(data).length === 0) {
			throw new Error('Empty payload data received');
		}

		PAYLOAD_CATEGORIES = Object.keys(data);
		window.PAYLOAD_CATEGORIES = PAYLOAD_CATEGORIES;
		payloadCategoriesLoaded = true;
		payloadLoadRetries = 0;
		console.log(`Loaded ${PAYLOAD_CATEGORIES.length} payload categories from GitHub`);
		renderCategoryCheckboxes();

		// Update loading indicator with success
		const indicator = document.getElementById('payloadLoadingIndicator');
		if (indicator) indicator.remove();
	} catch (e) {
		console.error('Failed to load payload categories:', e);
		payloadLoadRetries++;

		if (payloadLoadRetries <= PAYLOAD_MAX_AUTO_RETRIES) {
			// Auto-retry with increasing delay
			const delay = payloadLoadRetries * 2000;
			if (container) {
				container.innerHTML = `<div class="py-4" id="payloadLoadingIndicator">
					${cyberLoader({ size: 'sm', color: 'text-cyber-warning', text: `Retry ${payloadLoadRetries}/${PAYLOAD_MAX_AUTO_RETRIES}...`, inline: true })}
				</div>`;
			}
			setTimeout(loadPayloadCategories, delay);
		} else {
			// Show error with retry button
			showPayloadLoadError(e.message);
		}
	}
}

function showPayloadLoadError(errorMsg) {
	const container = document.getElementById('categoryCheckboxes');
	if (!container) return;
	container.innerHTML = `<div class="text-center py-4 px-3">
		<svg class="w-8 h-8 text-cyber-danger mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
		</svg>
		<p class="text-xs text-cyber-danger font-semibold mb-1">Failed to load payloads</p>
		<p class="text-[10px] text-gray-500 mb-3">${errorMsg || 'Connection to GitHub failed'}</p>
		<button type="button" onclick="retryLoadPayloads()"
				class="px-4 py-2 bg-cyber-accent/20 border border-cyber-accent/40 rounded-lg text-xs font-bold text-cyber-accent hover:bg-cyber-accent/30 transition-all">
			<svg class="w-3.5 h-3.5 inline-block mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
			</svg>
			Retry
		</button>
	</div>`;
}

function retryLoadPayloads() {
	payloadLoadRetries = 0;
	loadPayloadCategories();
}

function renderCategoryCheckboxes() {
	const container = document.getElementById('categoryCheckboxes');
	if (!container) return;
	// Remove loading indicator if present
	const indicator = document.getElementById('payloadLoadingIndicator');
	if (indicator) indicator.remove();

	// If custom payloads module is loaded, delegate to updateCategoryCheckboxesWithCustom
	if (typeof window.updateCategoryCheckboxesWithCustom === 'function') {
		if (typeof window.initCustomPayloads === 'function') {
			window.initCustomPayloads();
		}
		window.updateCategoryCheckboxesWithCustom();
		return;
	}

	const cats = window.PAYLOAD_CATEGORIES || PAYLOAD_CATEGORIES || [];
	if (cats.length === 0) {
		container.innerHTML = '<div class="text-center py-3 text-gray-400">No categories loaded yet...</div>';
		return;
	}
	container.innerHTML = '';
	const defaultChecked = ['SQL Injection', 'XSS'];
	cats.forEach((cat, idx) => {
		const id = 'cat_' + idx;
		const div = document.createElement('div');
		div.className = 'form-check';
		div.innerHTML = `<input class="form-check-input w-3.5 h-3.5 accent-cyber-accent cursor-pointer" type="checkbox" value="${cat}" id="${id}"${defaultChecked.includes(cat) ? ' checked' : ''}>
      <label class="form-check-label" for="${id}">${cat}</label>`;
		container.appendChild(div);
	});

	// Restore any saved category selections if present
	try {
		const saved = localStorage.getItem('wafchecker_categories');
		if (saved) {
			const arr = JSON.parse(saved);
			if (Array.isArray(arr) && arr.length > 0) {
				const cbs = container.querySelectorAll('input[type=checkbox]');
				cbs.forEach((cb) => {
					cb.checked = arr.includes(cb.value);
				});
			}
		}
	} catch {}
}

function highlightCategoryCheckboxesByResults(results, falsePositiveMode = false) {
	// В режиме false positive: выделяем категории где есть 403 (плохо)
	// В обычном режиме: выделяем категории где есть 200 (плохо)
	const categoriesWithBadStatus = new Set();
	if (Array.isArray(results)) {
		results.forEach((r) => {
			if (falsePositiveMode) {
				if (r.status === 403 || r.status === '403') {
					categoriesWithBadStatus.add(r.category);
				}
			} else {
				if (r.status === 200 || r.status === '200') {
					categoriesWithBadStatus.add(r.category);
				}
			}
		});
	}
	// Пробегаем по чекбоксам и выделяем нужные label
	const categoryCheckboxes = document.querySelectorAll('#categoryCheckboxes input[type=checkbox]');
	categoryCheckboxes.forEach((cb) => {
		const label = cb.parentElement.querySelector('.form-check-label');
		if (!label) return;
		if (categoriesWithBadStatus.has(cb.value)) {
			label.classList.add('category-label-danger');
		} else {
			label.classList.remove('category-label-danger');
		}
	});
}

// --- Toggle payload template section within Advanced Settings ---
function updatePayloadTemplateSection() {
	const methodPOST = document.getElementById('methodPOST');
	const methodPUT = document.getElementById('methodPUT');
	const section = document.getElementById('payloadTemplateSection');
	if (!section) return;
	if ((methodPOST && methodPOST.checked) || (methodPUT && methodPUT.checked)) {
		section.style.display = '';
	} else {
		section.style.display = 'none';
	}
}

// --- Switch between Target and Advanced tabs ---
function switchConfigTab(tab) {
	const tabTarget = document.getElementById('tabTarget');
	const tabAdvanced = document.getElementById('tabAdvanced');
	const panelTarget = document.getElementById('panelTarget');
	const panelAdvanced = document.getElementById('panelAdvanced');

	if (!tabTarget || !tabAdvanced || !panelTarget || !panelAdvanced) return;

	if (tab === 'target') {
		// Activate Target tab
		tabTarget.classList.add('border-cyber-accent', 'text-cyber-accent');
		tabTarget.classList.remove('border-transparent', 'text-gray-400', 'text-slate-400');
		tabAdvanced.classList.remove('border-cyber-accent', 'text-cyber-accent');
		tabAdvanced.classList.add('border-transparent', 'text-slate-400');
		panelTarget.style.display = 'block';
		panelAdvanced.style.display = 'none';
	} else {
		// Activate Advanced tab
		tabAdvanced.classList.add('border-cyber-accent', 'text-cyber-accent');
		tabAdvanced.classList.remove('border-transparent', 'text-gray-400', 'text-slate-400');
		tabTarget.classList.remove('border-cyber-accent', 'text-cyber-accent');
		tabTarget.classList.add('border-transparent', 'text-slate-400');
		panelTarget.style.display = 'none';
		panelAdvanced.style.display = 'block';
	}
}

// Update description text - deprecated, kept for compatibility
function updateDescriptionText() {
	// No longer needed as description was removed from UI
}

// Progress bar helper functions

let progressInterval = null;
let progressAnimationValue = 0;

function showProgress() {
	const progressBar = document.getElementById('progressBar');
	if (progressBar) {
		progressBar.classList.remove('hidden');
	}
	// Reset slow warning
	const slowWarningEl = document.getElementById('progressSlowWarning');
	if (slowWarningEl) {
		slowWarningEl.textContent = '';
		slowWarningEl.classList.add('hidden');
	}
	// Start indeterminate animation
	startIndeterminateProgress();
}

function hideProgress() {
	const progressBar = document.getElementById('progressBar');
	if (progressBar) {
		progressBar.classList.add('hidden');
	}
	stopIndeterminateProgress();
}

function startIndeterminateProgress() {
	stopIndeterminateProgress();
	progressAnimationValue = 0;
	const progressFill = document.getElementById('progressFill');
	if (progressFill) {
		progressFill.style.transition = 'width 0.3s ease-out';
	}
}

function stopIndeterminateProgress() {
	if (progressInterval) {
		clearInterval(progressInterval);
		progressInterval = null;
	}
}

function updateProgress(current, total, category = '', text = 'Running tests...', batch = 0) {
	stopIndeterminateProgress();

	// Calculate percent, allow 100% when current >= total
	const percent = total > 0 ? Math.min(Math.round((current / total) * 100), 100) : 0;

	const progressFill = document.getElementById('progressFill');
	const progressPercent = document.getElementById('progressPercent');
	const progressText = document.getElementById('progressText');
	const progressCategory = document.getElementById('progressCategory');
	const progressCount = document.getElementById('progressCount');

	if (progressFill) {
		progressFill.style.transition = 'width 0.5s ease-out';
		progressFill.style.width = `${percent}%`;
	}
	if (progressPercent) progressPercent.textContent = `${percent}%`;
	if (progressText) progressText.textContent = text;
	if (progressCategory) progressCategory.textContent = category || 'Processing...';
	if (progressCount) {
		const totalText = total > 0 ? ` / ${total}` : '';
		progressCount.textContent = `${current}${totalText} tests`;
	}
}

function finalizeProgress() {
	const progressFill = document.getElementById('progressFill');
	const progressPercent = document.getElementById('progressPercent');
	const progressText = document.getElementById('progressText');
	const progressCategory = document.getElementById('progressCategory');

	if (progressFill) {
		progressFill.style.transition = 'width 0.3s ease-out';
		progressFill.style.width = '100%';
	}
	if (progressPercent) progressPercent.textContent = '100%';
	if (progressText) progressText.textContent = 'Tests completed!';
	if (progressCategory) progressCategory.textContent = 'Complete';
}


async function fetchResults() {
	// Close mobile drawer if open
	closeMobileDrawer();

	const btn = document.getElementById('checkBtn');
	btn.disabled = true;
	const oldText = btn.textContent;
	btn.textContent = 'Testing...';
	const urlInput = document.getElementById('url');
	const url = normalizeUrl(urlInput.value);

	// Update the input field with normalized URL if it was changed
	if (url !== urlInput.value) {
		urlInput.value = url;
	}

	// Show progress bar
	showProgress();
	updateProgress(0, 0, 'Initializing...', 'Preparing tests...');

	// Create test session
	const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
	const startTime = new Date().toISOString();

	// Collect selected methods from method checkboxes
	const methodCheckboxes = document.querySelectorAll('.methods-grid input[type=checkbox]');
	const selectedMethods = Array.from(methodCheckboxes)
		.filter((cb) => cb.checked)
		.map((cb) => cb.value);

	// Ensure at least one method is selected
	if (selectedMethods.length === 0) {
		showAlert('Please select at least one HTTP method', 'No Method Selected', 'warning');
		btn.disabled = false;
		btn.textContent = oldText;
		return;
	}
	// Ensure payloads are loaded from GitHub
	if (!payloadCategoriesLoaded || PAYLOAD_CATEGORIES.length === 0) {
		showAlert('Payloads are still loading from GitHub. Please wait a moment and try again.', 'Payloads Loading', 'warning');
		btn.disabled = false;
		btn.textContent = oldText;
		return;
	}
	// Follow redirect
	const followRedirect = document.getElementById('followRedirect')?.checked ? true : false;
	// False positive test
	const falsePositiveTest = document.getElementById('falsePositiveTest')?.checked ? true : false;
	// Case sensitive test
	const caseSensitiveTest = document.getElementById('caseSensitiveTest')?.checked ? true : false;
	// Enhanced payloads
	const enhancedPayloads = document.getElementById('enhancedPayloads')?.checked ? true : false;
	// Use advanced WAF bypass payloads
	const useAdvancedPayloads = document.getElementById('useAdvancedPayloadsCheckbox')?.checked ? true : false;
	// Auto detect WAF
	const autoDetectWAF = document.getElementById('autoDetectWAF')?.checked ? true : false;
	// Use encoding variations
	const useEncodingVariations = document.getElementById('useEncodingVariations')?.checked ? true : false;
	// HTTP Manipulation
	const httpManipulation = document.getElementById('httpManipulation')?.checked ? true : false;
	// Adaptive PPO payload mutation
	const adaptiveMutation = document.getElementById('adaptiveMutation')?.checked ? true : false;
	// Collect selected categories
	const categoryCheckboxes = document.querySelectorAll('#categoryCheckboxes input[type=checkbox]');
	const selectedCategories = Array.from(categoryCheckboxes)
		.filter((cb) => cb.checked)
		.map((cb) => cb.value);
	// --- Сохраняем в localStorage ---
	localStorage.setItem('wafchecker_url', url);
	localStorage.setItem('wafchecker_methods', JSON.stringify(selectedMethods));
	localStorage.setItem('wafchecker_categories', JSON.stringify(selectedCategories));
	localStorage.setItem('wafchecker_followRedirect', followRedirect ? '1' : '0');
	localStorage.setItem('wafchecker_falsePositiveTest', falsePositiveTest ? '1' : '0');
	localStorage.setItem('wafchecker_caseSensitiveTest', caseSensitiveTest ? '1' : '0');
	localStorage.setItem('wafchecker_enhancedPayloads', enhancedPayloads ? '1' : '0');
	localStorage.setItem('wafchecker_useAdvancedPayloads', useAdvancedPayloads ? '1' : '0');
	localStorage.setItem('wafchecker_autoDetectWAF', autoDetectWAF ? '1' : '0');
	localStorage.setItem('wafchecker_useEncodingVariations', useEncodingVariations ? '1' : '0');
	localStorage.setItem('wafchecker_httpManipulation', httpManipulation ? '1' : '0');
	localStorage.setItem('wafchecker_adaptiveMutation', adaptiveMutation ? '1' : '0');
	// --- Получаем шаблон и заголовки ---\n
	let payloadTemplate = '';
	const templateEl = document.getElementById('payloadTemplate');
	if (templateEl) {
		payloadTemplate = templateEl.value;
		localStorage.setItem('wafchecker_payloadTemplate', payloadTemplate);
	}

	let customHeaders = '';
	const headersEl = document.getElementById('customHeaders');
	if (headersEl) {
		customHeaders = headersEl.value;
		localStorage.setItem('wafchecker_customHeaders', customHeaders);
	}
	let allResults = [];
	let detectedWAFType = window.detectedWAF || null;
	let wafDetection = null;

	// Auto-detect WAF first if enabled
	if (autoDetectWAF && !detectedWAFType) {
		updateProgress(0, 0, 'Detecting WAF...', 'Auto-detecting WAF...');
		try {
			const wafResponse = await fetch(`/api/waf-detect?url=${encodeURIComponent(url)}`);
			if (wafResponse.ok) {
				const wafData = await wafResponse.json();
				if (wafData.detection && wafData.detection.detected) {
					detectedWAFType = wafData.detection.wafType;
					window.detectedWAF = detectedWAFType;
					wafDetection = wafData.detection;
					showWAFPanel(wafData);
				}
			}
		} catch (error) {
			console.warn('WAF detection failed, continuing with regular test:', error);
		}
	}

	// Get custom payloads from localStorage
	let customPayloadsData = {};
	try {
		const stored = localStorage.getItem('wafchecker_customPayloads');
		if (stored) {
			customPayloadsData = JSON.parse(stored);
		}
	} catch (e) {
		console.warn('Failed to load custom payloads:', e);
	}

	// Use streaming API for real-time progress
	const totalCategories = selectedCategories.length;
	let estimatedTotalTests = totalCategories * selectedMethods.length * 5; // Initial estimate
	let completedTests = 0;
	let currentCategory = '';
	let slowCount = 0;

	updateProgress(0, estimatedTotalTests, `Starting ${totalCategories} categories...`, 'Initializing tests...', 0);

	// Prepare live results table in the DOM
	const resultsDiv = document.getElementById('results');
	resultsDiv.innerHTML = renderReportHeader(falsePositiveTest);
	resultsDiv.scrollIntoView({ behavior: 'smooth' });

	// Get the live tbody and scrollable container to append rows into
	const liveTbody = document.getElementById('liveResultsBody');
	const liveCounterEl = document.getElementById('liveTestCounter');
	const liveScroller = document.getElementById('liveResultsScroller');

	try {
		// Use streaming endpoint
		const params = new URLSearchParams({
			url,
			methods: selectedMethods.join(','),
			categories: selectedCategories.join(','),
			followRedirect: followRedirect ? '1' : '0',
			falsePositiveTest: falsePositiveTest ? '1' : '0',
			caseSensitiveTest: caseSensitiveTest ? '1' : '0',
			enhancedPayloads: enhancedPayloads ? '1' : '0',
			useAdvancedPayloads: useAdvancedPayloads ? '1' : '0',
			autoDetectWAF: autoDetectWAF ? '1' : '0',
			useEncodingVariations: useEncodingVariations ? '1' : '0',
			httpManipulation: httpManipulation ? '1' : '0',
			adaptiveMutation: adaptiveMutation ? '1' : '0',
			detectedWAF: detectedWAFType || '',
		});

		const response = await fetch(`/api/check-stream?${params.toString()}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				payloadTemplate,
				customHeaders,
				detectedWAF: detectedWAFType,
				customPayloads: customPayloadsData,
			}),
		});

		if (!response.ok) {
			throw new Error(`Stream request failed: ${response.status}`);
		}

		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let buffer = '';
		let streamComplete = false;

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split('\n');
			buffer = lines.pop() || ''; // Keep incomplete line in buffer

			for (const line of lines) {
				if (!line.trim()) continue;
				if (line.startsWith('data: ')) {
					try {
						const data = JSON.parse(line.slice(6));

						if (data.type === 'total') {
							estimatedTotalTests = data.count;
							updateProgress(0, estimatedTotalTests, 'Starting tests...', 'Initializing...', 0);
						} else if (data.type === 'result') {
							allResults.push(data.result);
							completedTests = data.completed;

							// Track slow responses
							const rt = data.result.responseTime || 0;
							if (rt >= SLOW_RESPONSE_THRESHOLD) slowCount++;

							// Update current category from result
							if (data.result.category && data.result.category !== currentCategory) {
								currentCategory = data.result.category;
							}

							// Append row to live table
							if (liveTbody) {
								liveTbody.insertAdjacentHTML('beforeend', renderResultRow(data.result, falsePositiveTest));
								// Auto-scroll the table container to show latest result
								if (liveScroller) {
									liveScroller.scrollTop = liveScroller.scrollHeight;
								}
							}

							// Update live counter (clean, no slow warning here)
							if (liveCounterEl) {
								liveCounterEl.textContent = `${completedTests} / ${estimatedTotalTests} tests completed`;
							}

							// Update slow warning in progress bar
							const slowWarningEl = document.getElementById('progressSlowWarning');
							if (slowWarningEl) {
								if (slowCount > 0) {
									slowWarningEl.textContent = `${slowCount} slow response${slowCount > 1 ? 's' : ''} (>${SLOW_RESPONSE_THRESHOLD}ms)`;
									slowWarningEl.classList.remove('hidden');
								}
							}

							// Update progress bar
							updateProgress(
								completedTests,
								estimatedTotalTests,
								currentCategory || 'Processing...',
								`${completedTests} tests completed`,
								0,
							);
						} else if (data.type === 'waf-detected') {
							if (data.waf && data.waf.detected) {
								detectedWAFType = data.waf.wafType;
								window.detectedWAF = detectedWAFType;
								if (typeof window.selectPPOWafProfile === 'function') {
									window.selectPPOWafProfile(detectedWAFType);
								}
							}
						} else if (data.type === 'complete') {
							streamComplete = true;
							break;
						} else if (data.type === 'error') {
							throw new Error(data.message || 'Unknown error');
						}
					} catch (e) {
						console.error('Error parsing SSE data:', e, line);
					}
				}
			}

			if (streamComplete) break;
		}

		// Finalize progress
		updateProgress(completedTests, completedTests, 'Complete!', 'All tests completed!');

		// Keep slow warning visible in progress bar at completion
		const slowWarningEl = document.getElementById('progressSlowWarning');
		if (slowWarningEl && slowCount > 0) {
			slowWarningEl.textContent = `${slowCount} slow response${slowCount > 1 ? 's' : ''} (>${SLOW_RESPONSE_THRESHOLD}ms)`;
			slowWarningEl.classList.remove('hidden');
		}

		const endTime = new Date().toISOString();

		// Create test session object
		currentTestSession = {
			id: sessionId,
			url,
			startTime,
			endTime,
			totalTests: allResults.length,
			results: allResults,
			wafDetection,
			settings: {
				methods: selectedMethods,
				categories: selectedCategories,
				followRedirect,
				falsePositiveTest,
				caseSensitiveTest,
				enhancedPayloads,
				useAdvancedPayloads,
				autoDetectWAF,
				useEncodingVariations,
				httpManipulation,
				adaptiveMutation,
			},
		};

		// Short delay to show 100% before hiding
		await new Promise((resolve) => setTimeout(resolve, 500));
		hideProgress();

		// Now render the final full report (replaces live table with summary + filters + table)
		document.getElementById('results').innerHTML = renderReport(allResults, falsePositiveTest);
		highlightCategoryCheckboxesByResults(allResults, falsePositiveTest);

		// Save to scan history
		saveScanToHistory(currentTestSession);

		// Show export controls
		showExportControls();
	} finally {
		btn.disabled = false;
		btn.textContent = oldText;
		hideProgress();
		if (typeof window.refreshPPODashboardWidget === 'function') {
			window.refreshPPODashboardWidget(true);
		}
	}
}

function restoreStateFromLocalStorage() {
	// URL
	const url = localStorage.getItem('wafchecker_url');
	if (url) {
		const urlInput = document.getElementById('url');
		if (urlInput) urlInput.value = url;
	}
	// Methods
	const methods = localStorage.getItem('wafchecker_methods');
	if (methods) {
		try {
			const arr = JSON.parse(methods);
			const methodCheckboxes = document.querySelectorAll('.methods-grid input[type=checkbox]');
			methodCheckboxes.forEach((cb) => {
				cb.checked = arr.includes(cb.value);
			});
		} catch {}
	}
	// Follow redirect
	const followRedirect = localStorage.getItem('wafchecker_followRedirect');
	if (followRedirect !== null) {
		const el = document.getElementById('followRedirect');
		if (el) el.checked = !!parseInt(followRedirect, 10);
	}

	// False positive test
	const falsePositiveTest = localStorage.getItem('wafchecker_falsePositiveTest');
	if (falsePositiveTest !== null) {
		const el = document.getElementById('falsePositiveTest');
		if (el) {
			el.checked = !!parseInt(falsePositiveTest, 10);
		}
	}

	// Case sensitive test
	const caseSensitiveTest = localStorage.getItem('wafchecker_caseSensitiveTest');
	if (caseSensitiveTest !== null) {
		const el = document.getElementById('caseSensitiveTest');
		if (el) {
			el.checked = caseSensitiveTest === '1';
		}
	}

	// Enhanced payloads
	const enhancedPayloads = localStorage.getItem('wafchecker_enhancedPayloads');
	if (enhancedPayloads !== null) {
		const el = document.getElementById('enhancedPayloads');
		if (el) {
			el.checked = enhancedPayloads === '1';
		}
	}

	// Auto detect WAF (defaults to ON)
	const autoDetectWAF = localStorage.getItem('wafchecker_autoDetectWAF');
	const autoDetectEl = document.getElementById('autoDetectWAF');
	if (autoDetectEl) {
		autoDetectEl.checked = autoDetectWAF !== null ? autoDetectWAF === '1' : true;
	}

	// HTTP Manipulation
	const httpManipulation = localStorage.getItem('wafchecker_httpManipulation');
	if (httpManipulation !== null) {
		const el = document.getElementById('httpManipulation');
		if (el) {
			el.checked = httpManipulation === '1';
		}
	}

	// Adaptive PPO mutation
	const adaptiveMutation = localStorage.getItem('wafchecker_adaptiveMutation');
	if (adaptiveMutation !== null) {
		const el = document.getElementById('adaptiveMutation');
		if (el) {
			el.checked = adaptiveMutation === '1';
		}
	}

	// Categories
	const categories = localStorage.getItem('wafchecker_categories');
	if (categories) {
		try {
			const arr = JSON.parse(categories);
			const categoryCheckboxes = document.querySelectorAll('#categoryCheckboxes input[type=checkbox]');
			categoryCheckboxes.forEach((cb) => {
				cb.checked = arr.includes(cb.value);
			});
		} catch {}
	}
	// Payload template
	const payloadTemplate = localStorage.getItem('wafchecker_payloadTemplate');
	if (payloadTemplate) {
		const templateEl = document.getElementById('payloadTemplate');
		if (templateEl) templateEl.value = payloadTemplate;
	}

	// Custom headers
	const customHeaders = localStorage.getItem('wafchecker_customHeaders');
	if (customHeaders) {
		const headersEl = document.getElementById('customHeaders');
		if (headersEl) headersEl.value = customHeaders;
	}
}

// WAF Detection functionality

function toggleAllCategories() {
	const checkboxes = document.querySelectorAll('#categoryCheckboxes input[type=checkbox]');
	const allChecked = Array.from(checkboxes).every((cb) => cb.checked);
	const toggleBtn = document.getElementById('toggleAllCategoriesBtn');

	checkboxes.forEach((cb) => {
		cb.checked = !allChecked;
	});

	// Update button icon
	if (toggleBtn) {
		const svg = toggleBtn.querySelector('svg');
		if (svg) {
			if (allChecked) {
				// Show "select all" icon (list with checks)
				svg.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>';
			} else {
				// Show "deselect all" icon (X marks)
				svg.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>';
			}
		}
	}
}


let _homePlaceholderHTML = '';

function goHome() {
	const resultsDiv = document.getElementById('results');
	if (resultsDiv && _homePlaceholderHTML) {
		resultsDiv.innerHTML = _homePlaceholderHTML;
	}
	// Reset progress bar
	const progressContainer = document.getElementById('progressContainer');
	if (progressContainer) progressContainer.style.display = 'none';

	// Hide export controls if visible
	if (typeof hideExportControls === 'function') {
		hideExportControls();
	}

	// Re-initialize PPO dashboard widget so it never stays stuck on "Loading profiles..."
	if (typeof window.refreshPPODashboardWidget === 'function') {
		window.refreshPPODashboardWidget();
	}

	window.scrollTo(0, 0);
}

// Initialize application
function initApp() {
	// Save the original homepage placeholder
	const homeResults = document.getElementById('results');
	if (homeResults) _homePlaceholderHTML = homeResults.innerHTML;

	// Force dark theme
	document.body.setAttribute('data-theme', 'dark');
	// Load payload categories dynamically from GitHub (via backend)
	loadPayloadCategories();
	// --- Enter в поле URL ---
	const urlInput = document.getElementById('url');
	if (urlInput) {
		urlInput.addEventListener('keydown', function (e) {
			if (e.key === 'Enter') {
				e.preventDefault();
				fetchResults();
			}
		});
	}
	// --- Восстановить состояние ---
	restoreStateFromLocalStorage();

	// Update description based on false positive test state
	updateDescriptionText();
	// --- Toggle payload template section on method change ---
	const methodCheckboxes = document.querySelectorAll('.methods-grid input[type=checkbox]');
	methodCheckboxes.forEach((cb) => {
		cb.addEventListener('change', updatePayloadTemplateSection);
	});
	updatePayloadTemplateSection();

	// Делегированный обработчик на #results
	const resultsDiv = document.getElementById('results');
	if (resultsDiv) {
		resultsDiv.addEventListener('change', function (e) {
			const target = e.target;
			// Select all statuses
			if (target && target.id === 'statusSelectAll') {
				const checked = target.checked;
				document.querySelectorAll('.status-filter-checkbox').forEach((cb) => {
					cb.checked = checked;
				});
				filterResultsTableByStatus();
			}
			// Обычные чекбоксы статусов
			if (target && target.classList.contains('status-filter-checkbox')) {
				// Если хотя бы один снят — select all снимается, если все включены — включается
				const all = document.querySelectorAll('.status-filter-checkbox');
				const checkedCount = Array.from(all).filter((cb) => cb.checked).length;
				const selectAll = document.getElementById('statusSelectAll');
				if (selectAll) {
					selectAll.checked = checkedCount === all.length;
				}
				filterResultsTableByStatus();
			}
		});
	}
}


// =============================================
// Mobile Drawer (slide-in panel)
// =============================================
function toggleMobileDrawer() {
	const aside = document.querySelector('aside');
	const overlay = document.getElementById('drawerOverlay');
	const isOpen = aside.classList.contains('drawer-open');
	if (isOpen) {
		closeMobileDrawer();
	} else {
		aside.classList.add('drawer-open');
		overlay.classList.add('active');
		document.body.classList.add('drawer-is-open');
	}
}

function closeMobileDrawer() {
	const aside = document.querySelector('aside');
	const overlay = document.getElementById('drawerOverlay');
	aside.classList.remove('drawer-open');
	overlay.classList.remove('active');
	document.body.classList.remove('drawer-is-open');
}

// Payload config: go back from editor to categories list (mobile)
function configGoBack() {
	const container = document.querySelector('#testConfigModal .modal-body > div');
	if (container) container.classList.remove('config-editing');
	// Update category list to reflect any changes
	renderConfigCategoryList();
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Function to toggle help content
function toggleHelp(helpId) {
	const helpElement = document.getElementById(helpId);
	if (helpElement) {
		helpElement.style.display = helpElement.style.display === 'none' ? 'block' : 'none';
	}
}

function filterResultsTableByStatus() {
	const checkedStatuses = Array.from(document.querySelectorAll('.status-filter-checkbox:checked')).map((cb) =>
		cb.getAttribute('data-status'),
	);
	const rows = document.querySelectorAll('#resultsTable tr[data-status]');
	rows.forEach((row) => {
		if (checkedStatuses.includes(row.getAttribute('data-status'))) {
			row.style.display = '';
		} else {
			row.style.display = 'none';
		}
	});
}

// Global variables for test session and batch testing
var currentTestSession = window.currentTestSession || null;
var currentBatchJob = window.currentBatchJob || null;
var batchPollInterval = window.batchPollInterval || null;

// Global variables for recon/audit data (for exports)
var lastSecurityHeadersData = window.lastSecurityHeadersData || null;
var lastDNSReconData = window.lastDNSReconData || null; // kept for backward compat
var lastFullReconData = window.lastFullReconData || null;
var lastSpeedTestData = window.lastSpeedTestData || null;
var lastSEOData = window.lastSEOData || null;

// Enhanced reporting and analytics functions

// Document ready listener
document.addEventListener('DOMContentLoaded', initApp);

// Expose key controller methods to window
window.renderAnalyticsCards = renderAnalyticsCards;
window.renderSummary = renderSummary;
window.renderResultRow = renderResultRow;
window.renderReportHeader = renderReportHeader;
window.renderReport = renderReport;
window.loadPayloadCategories = loadPayloadCategories;
window.showPayloadLoadError = showPayloadLoadError;
window.retryLoadPayloads = retryLoadPayloads;
window.renderCategoryCheckboxes = renderCategoryCheckboxes;
window.highlightCategoryCheckboxesByResults = highlightCategoryCheckboxesByResults;
window.updatePayloadTemplateSection = updatePayloadTemplateSection;
window.switchConfigTab = switchConfigTab;
window.updateDescriptionText = updateDescriptionText;
window.showProgress = showProgress;
window.hideProgress = hideProgress;
window.startIndeterminateProgress = startIndeterminateProgress;
window.stopIndeterminateProgress = stopIndeterminateProgress;
window.updateProgress = updateProgress;
window.finalizeProgress = finalizeProgress;
window.fetchResults = fetchResults;
window.restoreStateFromLocalStorage = restoreStateFromLocalStorage;
window.toggleAllCategories = toggleAllCategories;
window.goHome = goHome;
window.initApp = initApp;
window.toggleMobileDrawer = toggleMobileDrawer;
window.closeMobileDrawer = closeMobileDrawer;
window.configGoBack = configGoBack;
window.toggleHelp = toggleHelp;
window.filterResultsTableByStatus = filterResultsTableByStatus;
