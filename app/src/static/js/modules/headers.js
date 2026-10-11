/**
 * WAF-Checker - Security Headers Audit Module
 */

var lastSecurityHeadersData = null;

// =============================================
// FEATURE: Security Headers Audit
// =============================================
async function runSecurityHeaders() {
	const urlInput = document.getElementById('url');
	const url = normalizeUrl(urlInput.value);
	if (!url) {
		showAlert('Please enter a target URL first.', 'Missing URL', 'warning');
		return;
	}
	if (url !== urlInput.value) urlInput.value = url;

	const resultsDiv = document.getElementById('results');
	resultsDiv.innerHTML = `<div class="flex items-center justify-center h-full py-16">
		${cyberLoader({ size: 'lg', color: 'text-cyber-accent', text: `Running Security Headers Audit...`, subtext: escapeHtml(url) })}
	</div>`;

	try {
		const resp = await fetch(`/api/security-headers?url=${encodeURIComponent(url)}`);
		const data = await resp.json();
		if (!resp.ok) throw new Error(data.message || data.error || `HTTP ${resp.status}`);
		displaySecurityHeadersResults(data);
	} catch (e) {
		resultsDiv.innerHTML = `<div class="text-center py-10"><p class="text-cyber-danger font-bold">Security Headers Audit Failed</p><p class="text-gray-400 text-sm mt-2">${escapeHtml(e.message)}</p></div>`;
	}
}

function displaySecurityHeadersResults(data) {
	lastSecurityHeadersData = data;
	const resultsDiv = document.getElementById('results');
	const gradeColors = {
		'A+': 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
		A: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
		B: 'text-cyber-accent border-cyber-accent/30 bg-cyber-accent/10',
		C: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
		D: 'text-orange-400 border-orange-500/30 bg-orange-500/10',
		F: 'text-red-400 border-red-500/30 bg-red-500/10',
	};
	const gradeColor = gradeColors[data.grade] || 'text-slate-400 border-white/[0.08] bg-cyber-elevated';
	const severityColors = {
		critical: 'text-red-400 bg-red-500/10 border-red-500/30',
		high: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
		medium: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
		low: 'text-slate-400 bg-cyber-elevated border-white/[0.08]',
	};

	let html = `<div class="p-4">
		<!-- Header -->
		<div class="flex items-center justify-between mb-4 p-4 bg-cyber-card border border-white/[0.08] rounded-2xl shadow-none">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 rounded-xl bg-cyber-elevated border border-white/[0.08] flex items-center justify-center text-cyber-accent">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
					</svg>
				</div>
				<div>
					<h3 class="text-base font-bold text-white tracking-tight">Security Headers Audit</h3>
					<p class="text-xs text-slate-400"><span class="font-mono text-white">${escapeHtml(data.url)}</span> &mdash; ${data.responseTime}ms</p>
				</div>
			</div>
			<div class="flex items-center gap-3">
				<div class="flex items-center gap-2">
					<button onclick="exportReconJSON('headers')" class="text-xs bg-[#181923] hover:bg-[#20212d] border border-white/[0.08] hover:border-white/[0.18] text-slate-300 hover:text-white px-3.5 py-1.5 rounded-[10px] transition-all font-semibold shadow-none" title="Export JSON">JSON</button>
					<button onclick="exportReconHTML('headers')" class="text-xs bg-[#181923] hover:bg-[#20212d] border border-white/[0.08] hover:border-white/[0.18] text-slate-300 hover:text-white px-3.5 py-1.5 rounded-[10px] transition-all font-semibold shadow-none" title="Export HTML">HTML</button>
					<button onclick="exportReconScreenshot(event)" class="text-xs bg-[#181923] hover:bg-[#20212d] border border-white/[0.08] hover:border-white/[0.18] text-slate-300 hover:text-white px-2.5 py-1.5 rounded-[10px] transition-all shadow-none" title="Screenshot">
						<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
					</button>
				</div>
				<div class="flex items-center gap-2.5 pl-3 border-l border-white/[0.08]">
					<span class="text-xs text-slate-400 font-mono font-semibold">Score: ${data.score}/100</span>
					<span class="text-base font-bold px-3 py-0.5 rounded-[10px] border ${gradeColor}">${data.grade}</span>
				</div>
			</div>
		</div>

		<!-- Score bar & Summary Stats -->
		<div class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
			<div class="p-4 pb-3">
				<div class="flex items-center justify-between text-xs text-slate-400 mb-2">
					<span class="font-semibold uppercase tracking-wider">Overall Security Score</span>
					<span class="font-mono text-white font-semibold">${data.score}%</span>
				</div>
				<div class="h-2.5 bg-cyber-elevated rounded-full overflow-hidden border border-white/[0.06]">
					<div class="h-full rounded-full transition-all duration-500 ${data.score >= 70 ? 'bg-emerald-400' : data.score >= 40 ? 'bg-amber-400' : 'bg-red-400'}" style="width: ${data.score}%"></div>
				</div>
			</div>
			<div class="grid grid-cols-3 divide-x divide-white/[0.05] border-t border-white/[0.06]">
				<div class="p-4 text-center hover:bg-white/[0.015] transition-colors">
					<span class="text-2xl font-bold font-mono text-emerald-400 block mb-1">${data.present.length}</span>
					<span class="text-xs text-slate-400 uppercase font-semibold tracking-wider">Present</span>
				</div>
				<div class="p-4 text-center hover:bg-white/[0.015] transition-colors">
					<span class="text-2xl font-bold font-mono text-red-400 block mb-1">${data.missing.length}</span>
					<span class="text-xs text-slate-400 uppercase font-semibold tracking-wider">Missing</span>
				</div>
				<div class="p-4 text-center hover:bg-white/[0.015] transition-colors">
					<span class="text-2xl font-bold font-mono text-amber-400 block mb-1">${data.informationDisclosure.length}</span>
					<span class="text-xs text-slate-400 uppercase font-semibold tracking-wider">Info Leak</span>
				</div>
			</div>
		</div>`;

	// Missing headers (most important)
	if (data.missing.length > 0) {
		html += `<div class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
			<div class="px-4 py-3 border-b border-white/[0.08] bg-cyber-elevated/40 flex items-center justify-between">
				<h4 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-0 leading-none">Missing Headers (${data.missing.length})</h4>
			</div>
			<div class="divide-y divide-white/[0.05]">`;
		for (const h of data.missing) {
			const sc = severityColors[h.severity] || severityColors.low;
			html += `<div class="px-4 py-3 hover:bg-white/[0.015] transition-colors">
				<div class="flex items-center justify-between mb-1.5">
					<span class="text-sm font-mono text-white font-bold">${escapeHtml(h.header)}</span>
					<span class="text-[11px] px-2.5 py-0.5 rounded-md border ${sc} font-bold uppercase tracking-wider">${h.severity}</span>
				</div>
				<p class="text-xs text-slate-300 mb-1.5 leading-relaxed">${escapeHtml(h.description)}</p>
				<p class="text-xs text-cyber-accent font-medium mb-0"><span class="font-bold">Fix:</span> ${escapeHtml(h.recommendation)}</p>
			</div>`;
		}
		html += `</div></div>`;
	}

	// Present headers
	if (data.present.length > 0) {
		html += `<div class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
			<div class="px-4 py-3 border-b border-white/[0.08] bg-cyber-elevated/40 flex items-center justify-between">
				<h4 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-0 leading-none">Present Headers (${data.present.length})</h4>
			</div>
			<div class="divide-y divide-white/[0.05]">`;
		for (const h of data.present) {
			html += `<div class="px-4 py-3 hover:bg-white/[0.015] transition-colors">
				<div class="flex items-center justify-between mb-1">
					<span class="text-sm font-mono text-white font-bold">${escapeHtml(h.header)}</span>
					<span class="text-[11px] px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold uppercase tracking-wider">OK</span>
				</div>
				<div class="text-xs text-slate-300 font-mono break-all font-medium">${escapeHtml(h.value)}</div>
			</div>`;
		}
		html += `</div></div>`;
	}

	// Information disclosure
	if (data.informationDisclosure.length > 0) {
		html += `<div class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
			<div class="px-4 py-3 border-b border-white/[0.08] bg-cyber-elevated/40 flex items-center justify-between">
				<h4 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-0 leading-none">Information Disclosure (${data.informationDisclosure.length})</h4>
			</div>
			<div class="divide-y divide-white/[0.05]">`;
		for (const h of data.informationDisclosure) {
			html += `<div class="px-4 py-3 flex items-center justify-between hover:bg-white/[0.015] transition-colors">
				<span class="text-sm font-mono text-amber-400 font-semibold">${escapeHtml(h.header)}</span>
				<span class="text-xs font-mono text-slate-300 font-medium break-all text-right ml-4">${escapeHtml(h.value)}</span>
			</div>`;
		}
		html += `</div></div>`;
	}

	html += `</div>`;
	resultsDiv.innerHTML = html;
}


// Expose to window for global access
window.lastSecurityHeadersData = lastSecurityHeadersData;
window.runSecurityHeaders = runSecurityHeaders;
window.displaySecurityHeadersResults = displaySecurityHeadersResults;
