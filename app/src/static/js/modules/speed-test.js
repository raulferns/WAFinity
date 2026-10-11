/**
 * WAF-Checker - Speed Test Module
 */

var lastSpeedTestData = null;

// =============================================
// FEATURE: Speed Test
// =============================================
async function runSpeedTest() {
	const urlInput = document.getElementById('url');
	const url = normalizeUrl(urlInput.value);
	if (!url) {
		showAlert('Please enter a target URL first.', 'Missing URL', 'warning');
		return;
	}
	if (url !== urlInput.value) urlInput.value = url;

	const resultsDiv = document.getElementById('results');
	resultsDiv.innerHTML = `<div class="flex items-center justify-center h-full py-16">
		${cyberLoader({ size: 'lg', color: 'text-amber-400', text: 'Running Speed Test...', subtext: 'Fetching page & resources, analyzing performance... (max ~25s)' })}
	</div>`;

	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 30000);
		const resp = await fetch(`/api/speedtest?url=${encodeURIComponent(url)}`, { signal: controller.signal });
		clearTimeout(timeout);
		const data = await resp.json();
		if (!resp.ok) throw new Error(data.message || data.error || `HTTP ${resp.status}`);
		displaySpeedTestResults(data);
	} catch (e) {
		const msg = e.name === 'AbortError' ? 'Request timed out.' : e.message;
		resultsDiv.innerHTML = `<div class="text-center py-10"><p class="text-cyber-danger font-bold">Speed Test Failed</p><p class="text-gray-400 text-sm mt-2">${escapeHtml(msg)}</p><button onclick="runSpeedTest()" class="mt-4 px-4 py-2 bg-amber-500/20 border border-amber-500/50 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-all text-sm">Retry</button></div>`;
	}
}

function displaySpeedTestResults(data) {
	lastSpeedTestData = data;
	const resultsDiv = document.getElementById('results');

	const fmtSize = (bytes) => {
		if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
		if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return bytes + ' B';
	};
	const fmtMs = (ms) => (ms !== null && ms !== undefined ? ms + 'ms' : 'N/A');

	// Score color logic — muted palette, no neon
	const scoreColor = data.score >= 90 ? '#10b981' : data.score >= 70 ? '#f59e0b' : data.score >= 50 ? '#fb923c' : '#ef4444';
	const scoreTextClass = data.score >= 90 ? 'text-emerald-400' : data.score >= 70 ? 'text-amber-400' : data.score >= 50 ? 'text-orange-400' : 'text-red-400';

	const gradeColors = {
		'A+': 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
		A: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
		B: 'text-cyber-accent border-cyber-accent/30 bg-cyber-accent/10',
		C: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
		D: 'text-orange-400 border-orange-500/30 bg-orange-500/10',
		F: 'text-red-400 border-red-500/30 bg-red-500/10',
	};
	const gradeColor = gradeColors[data.grade] || 'text-slate-400 border-white/[0.08] bg-cyber-elevated';

	// SVG donut circle generator — proper pie-chart style: dark fill inside, thick arc, no glow, bigger gauge
	const donutCircle = (label, val, trackColor, fillColor) => {
		if (val === null || val === undefined) return '';
		const score = Math.round(val);
		const r = 38;
		const cx = 50, cy = 50;
		const circ = 2 * Math.PI * r;
		const filled = circ * (Math.min(100, Math.max(0, score)) / 100);
		const gap = circ - filled;
		return `<div class="bg-[#13141c] border border-white/[0.08] rounded-xl p-4 flex flex-col items-center justify-between">
			<div class="relative w-24 h-24 flex items-center justify-center">
				<svg class="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
					<circle cx="${cx}" cy="${cy}" r="${r}" fill="#0e0f15" stroke="${trackColor}" stroke-width="8" />
					<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${fillColor}" stroke-width="8"
						stroke-dasharray="${filled.toFixed(2)} ${gap.toFixed(2)}"
						stroke-linecap="butt" />
				</svg>
				<div class="absolute inset-0 flex items-center justify-center">
					<span class="text-2xl font-bold font-mono text-white">${score}</span>
				</div>
			</div>
			<span class="text-xs font-bold text-slate-300 uppercase tracking-wider text-center mt-3">${label}</span>
		</div>`;
	};

	// Bar-type line generator — as per Security Headers: rounded-full pill bar with cyber-elevated track
	const barLine = (pct, fillColor) => {
		const clampedPct = Math.min(100, Math.max(0, pct));
		return `<div class="h-2 w-full bg-cyber-elevated rounded-full overflow-hidden border border-white/[0.06] mt-3">
			<div class="h-full rounded-full transition-all duration-500" style="width:${clampedPct.toFixed(1)}%;background:${fillColor};"></div>
		</div>`;
	};

	let html = `<div class="p-4">
		<!-- Header -->
		<div class="flex items-center justify-between mb-4 p-4 bg-cyber-card border border-white/[0.08] rounded-2xl shadow-none flex-wrap gap-3">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 rounded-xl bg-cyber-elevated border border-white/[0.08] flex items-center justify-center text-slate-300">
					<svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
				</div>
				<div>
					<h3 class="text-base font-bold text-white tracking-tight">Speed Test</h3>
					<p class="text-sm text-slate-400 mt-0.5"><span class="font-mono text-slate-200 font-medium">${escapeHtml(data.hostname)}</span> &mdash; <span class="font-mono">${fmtMs(data.timing.total)}</span></p>
				</div>
			</div>
			<div class="flex items-center gap-3">
				<div class="flex items-center gap-2">
					<button onclick="exportReconJSON('speed')" class="text-xs bg-[#181923] hover:bg-[#20212d] border border-white/[0.08] hover:border-white/[0.18] text-slate-300 hover:text-white px-3.5 py-1.5 rounded-[10px] transition-all font-semibold shadow-none" title="Export JSON">JSON</button>
					<button onclick="exportReconHTML('speed')" class="text-xs bg-[#181923] hover:bg-[#20212d] border border-white/[0.08] hover:border-white/[0.18] text-slate-300 hover:text-white px-3.5 py-1.5 rounded-[10px] transition-all font-semibold shadow-none" title="Export HTML">HTML</button>
					<button onclick="exportReconScreenshot(event)" class="text-xs bg-[#181923] hover:bg-[#20212d] border border-white/[0.08] hover:border-white/[0.18] text-slate-300 hover:text-white px-2.5 py-1.5 rounded-[10px] transition-all shadow-none" title="Screenshot">
						<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
					</button>
				</div>
				<div class="flex items-center gap-2.5 pl-3 border-l border-white/[0.08]">
					<span class="text-xs text-slate-400 font-mono font-semibold">Performance Score: <span class="text-white font-bold">${data.score}/100</span></span>
					<span class="text-base font-bold px-3 py-0.5 rounded-[10px] border ${gradeColor}">${data.grade}</span>
				</div>
			</div>
		</div>

		<!-- Score bar & Summary Stats (Styled as per Headers page) -->
		<div class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
			<div class="p-4 pb-3">
				<div class="flex items-center justify-between text-xs text-slate-400 mb-2">
					<span class="font-semibold uppercase tracking-wider">Overall Performance Score</span>
					<span class="font-mono text-white font-semibold">${data.score}%</span>
				</div>
				<div class="h-2.5 bg-cyber-elevated rounded-full overflow-hidden border border-white/[0.06]">
					<div class="h-full rounded-full transition-all duration-500" style="width: ${data.score}%; background: ${scoreColor};"></div>
				</div>
			</div>
			<div class="grid grid-cols-3 divide-x divide-white/[0.05] border-t border-white/[0.06]">
				<div class="p-4 text-center hover:bg-white/[0.015] transition-colors">
					<span class="text-2xl font-bold font-mono text-white block mb-1">${data.statusCode}${data.redirected ? ' <span class="text-xs text-amber-400 font-semibold align-middle">(Redirected)</span>' : ''}</span>
					<span class="text-xs text-slate-400 uppercase font-semibold tracking-wider">HTTP Status</span>
				</div>
				<div class="p-4 text-center hover:bg-white/[0.015] transition-colors">
					<span class="text-2xl font-bold font-mono ${data.penalties.length > 0 ? 'text-amber-400' : 'text-emerald-400'} block mb-1">${data.penalties.length}</span>
					<span class="text-xs text-slate-400 uppercase font-semibold tracking-wider">Issues Detected</span>
				</div>
				<div class="p-4 text-center hover:bg-white/[0.015] transition-colors">
					<span class="text-2xl font-bold font-mono text-cyber-accent block mb-1">${fmtMs(data.timing.total)}</span>
					<span class="text-xs text-slate-400 uppercase font-semibold tracking-wider">Total Latency</span>
				</div>
			</div>
		</div>`;

	// === Lighthouse-style Metrics (computed locally) ===
	const lh = data.lighthouse;
	if (lh) {
		const getDonutColors = (score) => {
			if (score >= 90) return { fill: '#10b981', track: 'rgba(255, 255, 255, 0.08)' };
			if (score >= 50) return { fill: '#f59e0b', track: 'rgba(255, 255, 255, 0.08)' };
			return { fill: '#ef4444', track: 'rgba(255, 255, 255, 0.08)' };
		};

		const scoreCircle = (label, val) => {
			if (val === null || val === undefined) return '';
			const score = Math.round(val);
			const c = getDonutColors(score);
			return donutCircle(label, val, c.track, c.fill);
		};

		html += `<div class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
			<div class="px-4 py-3 border-b border-white/[0.08] bg-cyber-elevated/40 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<svg class="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
					<h4 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-0 leading-none">Lighthouse Scores (Estimated)</h4>
				</div>
				<span class="text-xs text-slate-500 font-mono uppercase tracking-wider">computed locally</span>
			</div>
			<div class="p-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
				${scoreCircle('Performance', lh.scores?.performance)}
				${scoreCircle('Accessibility', lh.scores?.accessibility)}
				${scoreCircle('Best Practices', lh.scores?.['best-practices'])}
				${scoreCircle('SEO', lh.scores?.seo)}
			</div>`;

		// Core Web Vitals
		if (lh.webVitals) {
			const wv = lh.webVitals;
			const vitalCard = (label, metric) => {
				if (!metric) return '';
				const score = metric.score !== undefined ? metric.score : 1;
				const color = score >= 0.9 ? 'text-emerald-400' : score >= 0.5 ? 'text-amber-400' : 'text-red-400';

				return (
					'<div class="p-4 text-center bg-[#111218] hover:bg-[#151622] transition-colors flex flex-col justify-between">' +
					'<span class="text-xs text-slate-400 uppercase font-bold block mb-1 tracking-wider">' +
					label +
					'</span>' +
					'<span class="text-lg font-bold font-mono tracking-tight ' +
					color +
					'">' +
					escapeHtml(metric.value) +
					'</span>' +
					'</div>'
				);
			};
			html += `<div class="grid grid-cols-3 md:grid-cols-6 divide-y md:divide-y-0 divide-x divide-white/[0.05] border-t border-white/[0.08]">
				${vitalCard('FCP', wv.fcp)}
				${vitalCard('LCP', wv.lcp)}
				${vitalCard('TBT', wv.tbt)}
				${vitalCard('CLS', wv.cls)}
				${vitalCard('Speed Index', wv.si)}
				${vitalCard('TTI', wv.tti)}
			</div>`;
		}

		// Detailed checks (expandable)
		const renderChecks = (title, checks, color) => {
			if (!checks || checks.length === 0) return '';
			const passed = checks.filter((c) => c.pass).length;
			let h = `<details class="border-t border-white/[0.08]">
				<summary class="px-4 py-2.5 bg-cyber-elevated/30 cursor-pointer flex items-center justify-between hover:bg-white/[0.02] transition-colors select-none">
					<span class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-0 leading-none">${title}</span>
					<span class="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#13141c] border border-white/[0.08]" style="color:${color}">${passed}/${checks.length}</span>
				</summary>
				<div class="divide-y divide-white/[0.05] bg-[#0e0f15]/40">`;
			for (const c of checks) {
				const icon = c.pass
					? '<svg class="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>'
					: '<svg class="w-4 h-4 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>';
				h += `<div class="px-4 py-2.5 flex items-center gap-2.5 hover:bg-white/[0.015] transition-colors">${icon}<span class="text-sm text-slate-300 font-medium">${escapeHtml(c.label)}</span></div>`;
			}
			h += `</div></details>`;
			return h;
		};
		const accColor = lh.scores.accessibility >= 90 ? '#10b981' : lh.scores.accessibility >= 50 ? '#f59e0b' : '#ef4444';
		const bpColor = lh.scores['best-practices'] >= 90 ? '#10b981' : lh.scores['best-practices'] >= 50 ? '#f59e0b' : '#ef4444';
		const seoColor = lh.scores.seo >= 90 ? '#10b981' : lh.scores.seo >= 50 ? '#f59e0b' : '#ef4444';
		html += renderChecks('Accessibility Checks', lh.accessibilityChecks, accColor);
		html += renderChecks('Best Practices Checks', lh.bestPracticesChecks, bpColor);
		html += renderChecks('SEO Checks', lh.seoChecks, seoColor);

		html += `</div>`;
	}

	// === Timing Breakdown ===
	const dns = data.timing.dns || 0;
	const ttfb = data.timing.ttfb || 0;
	const download = data.timing.download || 0;
	// Request lifecycle segments: DNS lookup, TTFB, and Content Download
	const pipelineTotal = Math.max(1, dns + ttfb + download);
	const dnsPct = Math.max(1, (dns / pipelineTotal) * 100);
	const ttfbPct = Math.max(1, (ttfb / pipelineTotal) * 100);
	const dlPct = Math.max(1, (download / pipelineTotal) * 100);

	// Full Recon consistent timing colors
	const dnsBarColor = '#38bdf8';
	const ttfbBarColor = ttfb > 600 ? '#ef4444' : ttfb > 200 ? '#f59e0b' : '#10b981';
	const dlBarColor = '#10b981';
	const totalBarColor = pipelineTotal > 1500 ? '#ef4444' : pipelineTotal > 800 ? '#f59e0b' : '#10b981';

	html += `
		<!-- Timing Breakdown -->
		<div class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
			<div class="px-4 py-3 border-b border-white/[0.08] bg-cyber-elevated/40 flex items-center justify-between">
				<h4 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-0 leading-none">Timing Breakdown</h4>
				<span class="text-sm font-mono font-bold text-white">${fmtMs(data.timing.total)} total</span>
			</div>

			<!-- Pipeline Lifecycle Bar — styled as per headers with rounded-full pill bar and clean balanced padding -->
			<div class="p-4 border-b border-white/[0.06] bg-[#111218]/40">
				<div class="flex items-center justify-between text-xs mb-2.5">
					<span class="text-slate-400 uppercase tracking-wider font-bold">Request Pipeline Proportion</span>
					<span class="text-slate-500 font-mono text-xs">100% of lifecycle</span>
				</div>
				<div class="h-2.5 bg-cyber-elevated rounded-full overflow-hidden border border-white/[0.06] flex">
					<div style="width:${dnsPct.toFixed(1)}%;background:${dnsBarColor};height:100%;" title="DNS: ${fmtMs(dns)} (${dnsPct.toFixed(0)}%)"></div>
					<div style="width:${ttfbPct.toFixed(1)}%;background:${ttfbBarColor};height:100%;" title="TTFB: ${fmtMs(ttfb)} (${ttfbPct.toFixed(0)}%)"></div>
					<div style="width:${dlPct.toFixed(1)}%;background:${dlBarColor};height:100%;" title="Download: ${fmtMs(download)} (${dlPct.toFixed(0)}%)"></div>
				</div>
				<div class="flex items-center gap-6 text-xs text-slate-400 font-mono mt-3 flex-wrap">
					<span class="flex items-center gap-2"><span class="w-2 h-2 rounded-full inline-block" style="background:${dnsBarColor};"></span>DNS: ${fmtMs(dns)} (${dnsPct.toFixed(0)}%)</span>
					<span class="flex items-center gap-2"><span class="w-2 h-2 rounded-full inline-block" style="background:${ttfbBarColor};"></span>TTFB: ${fmtMs(ttfb)} (${ttfbPct.toFixed(0)}%)</span>
					<span class="flex items-center gap-2"><span class="w-2 h-2 rounded-full inline-block" style="background:${dlBarColor};"></span>Download: ${fmtMs(download)} (${dlPct.toFixed(0)}%)</span>
				</div>
			</div>

			<div class="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 divide-x divide-white/[0.05]">
				<div class="p-4 hover:bg-white/[0.015] transition-colors">
					<span class="text-xs text-slate-400 uppercase font-bold block mb-1.5 tracking-wider">DNS Lookup</span>
					<span class="text-xl font-mono font-bold text-white block">${fmtMs(data.timing.dns)}</span>
					${barLine(Math.min(100, (dns / 300) * 100), dnsBarColor)}
				</div>
				<div class="p-4 hover:bg-white/[0.015] transition-colors">
					<span class="text-xs text-slate-400 uppercase font-bold block mb-1.5 tracking-wider">TTFB</span>
					<span class="text-xl font-mono font-bold block ${ttfb > 600 ? 'text-red-400' : ttfb > 200 ? 'text-amber-400' : 'text-emerald-400'}">${fmtMs(data.timing.ttfb)}</span>
					${barLine(Math.min(100, (ttfb / 1000) * 100), ttfbBarColor)}
				</div>
				<div class="p-4 hover:bg-white/[0.015] transition-colors">
					<span class="text-xs text-slate-400 uppercase font-bold block mb-1.5 tracking-wider">Download</span>
					<span class="text-xl font-mono font-bold text-emerald-400 block">${fmtMs(data.timing.download)}</span>
					${barLine(Math.min(100, (download / 500) * 100), dlBarColor)}
				</div>
				<div class="p-4 hover:bg-white/[0.015] transition-colors">
					<span class="text-xs text-slate-400 uppercase font-bold block mb-1.5 tracking-wider">Total Latency</span>
					<span class="text-xl font-mono font-bold text-white block">${fmtMs(data.timing.total)}</span>
					${barLine(Math.min(100, (pipelineTotal / 2000) * 100), totalBarColor)}
				</div>
			</div>
		</div>`;

	// === Size Breakdown ===
	const totalSize = Math.max(1, data.sizes.total);
	// Full Recon consistent palette for resource size types
	const sizeItems = [
		{ label: 'HTML',       size: data.sizes.html,   hex: '#38bdf8' },
		{ label: 'JavaScript', size: data.sizes.js,     hex: '#fbbf24' },
		{ label: 'CSS',        size: data.sizes.css,    hex: '#818cf8' },
		{ label: 'Images',     size: data.sizes.images, hex: '#10b981' },
		{ label: 'Fonts',      size: data.sizes.fonts,  hex: '#f472b6' },
	].filter((s) => s.size > 0);

	const totalColorClass = data.sizes.total > 3000000 ? 'text-red-400' : data.sizes.total > 1500000 ? 'text-amber-400' : 'text-emerald-400';

	html += `
		<!-- Size Breakdown -->
		<div class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
			<div class="px-4 py-3 border-b border-white/[0.08] bg-cyber-elevated/40 flex items-center justify-between">
				<h4 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-0 leading-none">Size Breakdown</h4>
				<span class="text-sm font-mono font-bold ${totalColorClass}">${fmtSize(data.sizes.total)}</span>
			</div>
			<div class="p-4">
				<div class="flex items-center justify-between mb-2">
					<span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Payload Distribution</span>
					<span class="text-sm font-mono text-slate-400">${sizeItems.length} resource types</span>
				</div>
				<!-- Stacked composition bar — styled as per headers -->
				<div class="h-2.5 bg-cyber-elevated rounded-full overflow-hidden border border-white/[0.06] flex mb-4">
					${sizeItems.map((item, idx) => {
						const pct = Math.max(1, (item.size / totalSize) * 100);
						const borderLeft = idx > 0 ? 'border-left:1px solid rgba(0,0,0,0.3);' : '';
						return `<div style="width:${pct.toFixed(1)}%;background:${item.hex};height:100%;${borderLeft}" title="${item.label}: ${fmtSize(item.size)} (${pct.toFixed(0)}%)"></div>`;
					}).join('')}
				</div>

				<!-- Detailed Size Rows — bars as per headers -->
				<div class="space-y-3">
					${sizeItems.map((item) => {
						const pct = Math.max(0.5, (item.size / totalSize) * 100);
						return `<div class="flex items-center gap-3">
							<div class="flex items-center gap-2.5 shrink-0" style="width: 120px;">
								<span class="w-2 h-2 rounded-full inline-block shrink-0" style="background:${item.hex};"></span>
								<span class="text-sm font-semibold text-slate-300 truncate">${item.label}</span>
							</div>
							<div class="flex-1 h-2 bg-cyber-elevated rounded-full overflow-hidden border border-white/[0.06]">
								<div class="h-full rounded-full transition-all duration-500" style="width:${pct.toFixed(1)}%;background:${item.hex};"></div>
							</div>
							<span class="text-xs font-mono text-slate-500 text-right shrink-0" style="width: 48px;">${pct.toFixed(0)}%</span>
							<span class="text-sm font-mono font-medium text-slate-200 text-right shrink-0" style="width: 80px;">${fmtSize(item.size)}</span>
						</div>`;
					}).join('')}
				</div>
			</div>
		</div>`;

	// Resource Counts
	html += `<div class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
		<div class="px-4 py-3 border-b border-white/[0.08] bg-cyber-elevated/40 flex items-center justify-between">
			<h4 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-0 leading-none">Resource Counts</h4>
		</div>
		<div class="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 divide-x divide-white/[0.05]">
			<div class="p-4 text-center hover:bg-white/[0.015] transition-colors">
				<span class="text-2xl font-bold text-white font-mono tracking-tight block mb-1">${data.counts.cssFiles}</span>
				<span class="text-xs text-slate-400 uppercase font-bold tracking-wider block">CSS Files</span>
			</div>
			<div class="p-4 text-center hover:bg-white/[0.015] transition-colors">
				<span class="text-2xl font-bold text-white font-mono tracking-tight block mb-1">${data.counts.jsFiles}</span>
				<span class="text-xs text-slate-400 uppercase font-bold tracking-wider block">JS Files</span>
			</div>
			<div class="p-4 text-center hover:bg-white/[0.015] transition-colors">
				<span class="text-2xl font-bold text-white font-mono tracking-tight block mb-1">${data.counts.images}</span>
				<span class="text-xs text-slate-400 uppercase font-bold tracking-wider block">Images</span>
			</div>
			<div class="p-4 text-center hover:bg-white/[0.015] transition-colors">
				<span class="text-2xl font-bold text-white font-mono tracking-tight block mb-1">${data.counts.fonts}</span>
				<span class="text-xs text-slate-400 uppercase font-bold tracking-wider block">Fonts</span>
			</div>
		</div>
	</div>`;

	// Performance Indicators
	const perf = data.performance;
	const checkIcon = (ok) =>
		ok
			? '<svg class="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>'
			: '<svg class="w-4 h-4 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>';

	html += `<div class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
		<div class="px-4 py-3 border-b border-white/[0.08] bg-cyber-elevated/40 flex items-center justify-between">
			<h4 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-0 leading-none">Performance Indicators</h4>
		</div>
		<div class="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 divide-x-0 md:divide-x divide-white/[0.05]">
			<div class="divide-y divide-white/[0.05]">
				<div class="px-4 py-2.5 flex items-center gap-2.5 hover:bg-white/[0.015] transition-colors">${checkIcon(perf.compressed)}<span class="text-sm text-slate-300 font-medium">Compression ${perf.compressionType ? '(' + escapeHtml(perf.compressionType) + ')' : ''}</span></div>
				<div class="px-4 py-2.5 flex items-center gap-2.5 hover:bg-white/[0.015] transition-colors">${checkIcon(!!perf.cacheControl)}<span class="text-sm text-slate-300 font-medium">Cache Headers</span></div>
				<div class="px-4 py-2.5 flex items-center gap-2.5 hover:bg-white/[0.015] transition-colors">${checkIcon(perf.etag || perf.lastModified)}<span class="text-sm text-slate-300 font-medium">Validation (ETag/Last-Modified)</span></div>
				<div class="px-4 py-2.5 flex items-center gap-2.5 hover:bg-white/[0.015] transition-colors">${checkIcon(perf.http2)}<span class="text-sm text-slate-300 font-medium">HTTP/2 or HTTP/3</span></div>
				<div class="px-4 py-2.5 flex items-center gap-2.5 hover:bg-white/[0.015] transition-colors">${checkIcon(perf.renderBlockingScripts === 0)}<span class="text-sm text-slate-300 font-medium">No render-blocking scripts ${perf.renderBlockingScripts > 0 ? '<span class="text-red-400 font-mono font-semibold">(' + perf.renderBlockingScripts + ' blocking)</span>' : ''}</span></div>
			</div>
			<div class="divide-y divide-white/[0.05] border-t md:border-t-0 border-white/[0.05]">
				<div class="px-4 py-2.5 flex items-center gap-2.5 hover:bg-white/[0.015] transition-colors">${checkIcon(perf.lazyImages > 0 || perf.totalImages <= 3)}<span class="text-sm text-slate-300 font-medium">Lazy loading ${perf.lazyImages > 0 ? '<span class="text-emerald-400 font-mono font-semibold">(' + perf.lazyImages + '/' + perf.totalImages + ')</span>' : ''}</span></div>
				<div class="px-4 py-2.5 flex items-center gap-2.5 hover:bg-white/[0.015] transition-colors">${checkIcon(perf.modernImages > 0)}<span class="text-sm text-slate-300 font-medium">Modern images (WebP/AVIF) ${perf.modernImages > 0 ? '<span class="text-emerald-400 font-mono font-semibold">(' + perf.modernImages + ')</span>' : ''}</span></div>
				<div class="px-4 py-2.5 flex items-center gap-2.5 hover:bg-white/[0.015] transition-colors">${checkIcon(perf.hasCriticalCss)}<span class="text-sm text-slate-300 font-medium">Critical CSS</span></div>
				<div class="px-4 py-2.5 flex items-center gap-2.5 hover:bg-white/[0.015] transition-colors">${checkIcon(perf.preloadHints > 0)}<span class="text-sm text-slate-300 font-medium">Resource Hints ${perf.preloadHints > 0 ? '<span class="text-emerald-400 font-mono font-semibold">(' + perf.preloadHints + ')</span>' : ''}</span></div>
				<div class="px-4 py-2.5 flex items-center gap-2.5 hover:bg-white/[0.015] transition-colors">${checkIcon(perf.asyncScripts > 0 || perf.deferScripts > 0)}<span class="text-sm text-slate-300 font-medium">Async/Defer Scripts <span class="font-mono text-slate-400 font-medium">(${perf.asyncScripts}a/${perf.deferScripts}d)</span></span></div>
			</div>
		</div>
	</div>`;

	// Penalties (issues detected)
	if (data.penalties.length > 0) {
		html += `<div class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
			<div class="px-4 py-3 border-b border-white/[0.08] bg-cyber-elevated/40 flex items-center justify-between">
				<h4 class="text-sm font-bold text-red-400 uppercase tracking-wider mb-0 leading-none">Issues Detected (−${100 - data.score} points)</h4>
			</div>
			<div class="divide-y divide-white/[0.05]">`;
		for (const p of data.penalties) {
			html += `<div class="px-4 py-2.5 flex items-center gap-3 hover:bg-white/[0.015] transition-colors">
				<span class="text-xs font-mono font-bold text-red-400 bg-red-500/15 border border-red-500/30 px-2 py-0.5 rounded-md whitespace-nowrap">−${p.points}</span>
				<div>
					<span class="text-sm text-white font-semibold">${escapeHtml(p.rule)}</span>
					<span class="text-sm text-slate-400 ml-2">${escapeHtml(p.detail)}</span>
				</div>
			</div>`;
		}
		html += `</div></div>`;
	}

	// Advice section
	if (data.advice.length > 0) {
		const priorityStyles = {
			critical:   { bg: 'rgba(239,68,68,0.15)',  color: '#f87171', border: 'rgba(239,68,68,0.3)',   label: 'CRITICAL' },
			important:  { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: 'rgba(245,158,11,0.3)',  label: 'IMPORTANT' },
			suggestion: { bg: 'rgba(240,86,39,0.15)', color: '#f05627', border: 'rgba(240,86,39,0.3)',  label: 'TIP' },
		};
		html += `<div class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
			<div class="px-4 py-3 border-b border-white/[0.08] bg-cyber-elevated/40 flex items-center justify-between">
				<h4 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-0 leading-none">Optimization Advice (${data.advice.length})</h4>
			</div>
			<div class="divide-y divide-white/[0.05]">`;
		for (const a of data.advice) {
			const s = priorityStyles[a.priority] || priorityStyles.suggestion;
			html += `<div class="px-4 py-3 hover:bg-white/[0.015] transition-colors">
				<div class="flex items-start gap-2.5">
					<span class="text-xs font-mono font-bold px-2 py-0.5 rounded-md border whitespace-nowrap mt-0.5" style="border-color:${s.border};background:${s.bg};color:${s.color}">${s.label}</span>
					<div>
						<div class="text-sm text-white font-semibold">${escapeHtml(a.title)}</div>
						<div class="text-sm text-slate-400 mt-1 leading-relaxed">${escapeHtml(a.description)}</div>
					</div>
				</div>
			</div>`;
		}
		html += `</div></div>`;
	}

	// Resources waterfall (top 20 slowest)
	if (data.resources && data.resources.length > 0) {
		const sorted = [...data.resources].sort((a, b) => b.time - a.time);
		const maxTime = Math.max(...sorted.map((r) => r.time), 1);
		html += `<details open class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
			<summary class="px-4 py-3 border-b border-white/[0.08] bg-cyber-elevated/40 cursor-pointer flex items-center justify-between hover:bg-white/[0.02] transition-colors select-none">
				<span class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-0 leading-none">Resource Waterfall (${data.resources.length} resources)</span>
			</summary>
			<div class="divide-y divide-white/[0.05] max-h-[400px] overflow-y-auto">`;
		const typeColors = {
			css:   { hex: '#818cf8', bg: 'rgba(129,140,248,0.15)' },
			js:    { hex: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
			image: { hex: '#10b981', bg: 'rgba(16,185,129,0.15)' },
			font:  { hex: '#f472b6', bg: 'rgba(244,114,182,0.15)' },
		};
		for (const r of sorted.slice(0, 20)) {
			const barW = Math.max(2, (r.time / maxTime) * 100);
			const tc = typeColors[r.type] || { hex: '#6b7280', bg: 'rgba(107,114,128,0.12)' };
			const shortUrl = r.url.split('/').pop()?.split('?')[0] || r.url;
			html += `<div class="px-4 py-2 flex items-center gap-3 hover:bg-white/[0.015] transition-colors">
				<span class="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded text-center inline-block shrink-0" style="width: 52px; background:${tc.bg}; color:${tc.hex}">${r.type}</span>
				<span class="text-sm text-slate-300 font-mono overflow-hidden text-ellipsis whitespace-nowrap flex-1 min-w-0" title="${escapeHtml(r.url)}">${escapeHtml(shortUrl.length > 50 ? shortUrl.substring(0, 47) + '...' : shortUrl)}</span>
				<div class="h-2 bg-cyber-elevated rounded-full overflow-hidden border border-white/[0.06] shrink-0" style="width: 100px;">
					<div class="h-full rounded-full transition-all duration-500" style="width:${barW}%;background:${tc.hex};"></div>
				</div>
				<span class="text-sm font-mono text-slate-400 text-right shrink-0 whitespace-nowrap" style="width: 68px;">${fmtMs(r.time)}</span>
				<span class="text-sm font-mono text-slate-400 text-right shrink-0 whitespace-nowrap" style="width: 88px;">${fmtSize(r.size)}</span>
				${r.compressed ? '<span class="text-xs font-mono text-emerald-400 shrink-0 text-center" style="width: 30px;">gz</span>' : '<span class="text-xs font-mono text-slate-600 shrink-0 text-center" style="width: 30px;">raw</span>'}
			</div>`;
		}
		html += `</div></details>`;
	}

	// Server info
	html += `<div class="text-center text-sm text-slate-500 font-mono mt-3 pb-2">
		${perf.server ? 'Server: <span class="text-slate-400">' + escapeHtml(perf.server) + '</span> · ' : ''}
		Tested at ${new Date(data.timestamp).toLocaleString()}
	</div>`;

	html += `</div>`;
	resultsDiv.innerHTML = html;
}

// Expose to window for global access
window.lastSpeedTestData = lastSpeedTestData;
window.runSpeedTest = runSpeedTest;
window.displaySpeedTestResults = displaySpeedTestResults;
