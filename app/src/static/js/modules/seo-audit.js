/**
 * WAF-Checker - SEO Audit Module
 */

var lastSEOData = null;

// =============================================
// FEATURE: SEO Audit
// =============================================
async function runSEOTest() {
	const urlInput = document.getElementById('url');
	const url = normalizeUrl(urlInput.value);
	if (!url) {
		showAlert('Please enter a target URL first.', 'Missing URL', 'warning');
		return;
	}
	if (url !== urlInput.value) urlInput.value = url;

	const resultsDiv = document.getElementById('results');
	resultsDiv.innerHTML = `<div class="flex items-center justify-center h-full py-16">
		${cyberLoader({ size: 'lg', color: 'text-lime-400', text: 'Running SEO Audit...', subtext: 'Meta tags, sitemap, pages, structured data, links... (max ~25s)' })}
	</div>`;

	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 30000);
		const resp = await fetch(`/api/seo?url=${encodeURIComponent(url)}`, { signal: controller.signal });
		clearTimeout(timeout);
		const data = await resp.json();
		if (!resp.ok) throw new Error(data.message || data.error || `HTTP ${resp.status}`);
		displaySEOResults(data);
	} catch (e) {
		const msg = e.name === 'AbortError' ? 'Request timed out.' : e.message;
		resultsDiv.innerHTML = `<div class="text-center py-10"><p class="text-cyber-danger font-bold">SEO Audit Failed</p><p class="text-gray-400 text-sm mt-2">${escapeHtml(msg)}</p><button onclick="runSEOTest()" class="mt-4 px-4 py-2 bg-lime-500/20 border border-lime-500/50 text-lime-400 rounded-lg hover:bg-lime-500/30 transition-all text-sm">Retry</button></div>`;
	}
}

function displaySEOResults(data) {
	lastSEOData = data;
	const resultsDiv = document.getElementById('results');

	// Score colors
	const scoreHex =
		data.score >= 90
			? { text: '#34d399', border: 'rgba(16,185,129,0.3)', bg: 'rgba(16,185,129,0.1)' }
			: data.score >= 80
				? { text: '#f05627', border: 'rgba(240,86,39,0.3)', bg: 'rgba(240,86,39,0.1)' }
				: data.score >= 70
					? { text: '#facc15', border: 'rgba(234,179,8,0.3)', bg: 'rgba(234,179,8,0.1)' }
					: data.score >= 50
						? { text: '#fb923c', border: 'rgba(249,115,22,0.3)', bg: 'rgba(249,115,22,0.1)' }
						: { text: '#f87171', border: 'rgba(239,68,68,0.3)', bg: 'rgba(239,68,68,0.1)' };

	const passIcon =
		'<svg style="width:14px;height:14px;color:#10b981;flex-shrink:0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>';
	const failIcon =
		'<svg style="width:14px;height:14px;color:#ef4444;flex-shrink:0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>';

	const gradeColors = {
		'A+': 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
		A: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
		B: 'text-cyber-accent border-cyber-accent/30 bg-cyber-accent/10',
		C: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
		D: 'text-orange-400 border-orange-500/30 bg-orange-500/10',
		F: 'text-red-400 border-red-500/30 bg-red-500/10',
	};
	const gradeColor = gradeColors[data.grade] || 'text-slate-400 border-white/[0.08] bg-cyber-elevated';

	const catColors = {
		'Meta Tags': '#f05627',
		Technical: '#f05627',
		Indexability: '#f05627',
		Content: '#f05627',
		Links: '#f05627',
		Social: '#f05627',
		Performance: '#f05627',
		International: '#f05627',
		URL: '#f05627',
		Accessibility: '#f05627',
	};

	const passedCount = data.checks.filter((c) => c.pass).length;
	const totalChecks = data.checks.length;
	const failedCount = totalChecks - passedCount;
	const passPct = totalChecks > 0 ? Math.round((passedCount / totalChecks) * 100) : 0;

	let html = `<div class="p-4">
		<!-- Header -->
		<div class="flex items-center justify-between mb-4 p-4 bg-cyber-card border border-white/[0.08] rounded-2xl shadow-none flex-wrap gap-3">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 rounded-xl bg-cyber-elevated border border-white/[0.08] flex items-center justify-center text-slate-300">
					<svg class="w-5 h-5 text-lime-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
				</div>
				<div>
					<h3 class="text-base font-bold text-white tracking-tight">SEO Audit</h3>
					<p class="text-xs text-slate-400 mt-0.5"><span class="font-mono text-slate-200 font-medium">${escapeHtml(data.hostname)}</span> &mdash; <span class="font-mono">${data.responseTime}ms</span></p>
				</div>
			</div>
			<div class="flex items-center gap-3">
				<div class="flex items-center gap-2">
					<button onclick="exportReconJSON('seo')" class="text-xs bg-[#181923] hover:bg-[#20212d] border border-white/[0.08] hover:border-white/[0.18] text-slate-300 hover:text-white px-3.5 py-1.5 rounded-[10px] transition-all font-semibold shadow-none" title="Export JSON">JSON</button>
					<button onclick="exportReconHTML('seo')" class="text-xs bg-[#181923] hover:bg-[#20212d] border border-white/[0.08] hover:border-white/[0.18] text-slate-300 hover:text-white px-3.5 py-1.5 rounded-[10px] transition-all font-semibold shadow-none" title="Export HTML">HTML</button>
					<button onclick="exportReconScreenshot(event)" class="text-xs bg-[#181923] hover:bg-[#20212d] border border-white/[0.08] hover:border-white/[0.18] text-slate-300 hover:text-white px-2.5 py-1.5 rounded-[10px] transition-all shadow-none" title="Screenshot">
						<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
					</button>
				</div>
				<div class="flex items-center gap-2.5 pl-3 border-l border-white/[0.08]">
					<span class="text-xs text-slate-400 font-mono font-semibold">SEO Score: <span class="text-white font-bold">${data.score}/100</span></span>
					<span class="text-base font-bold px-3 py-0.5 rounded-[10px] border ${gradeColor}">${data.grade}</span>
				</div>
			</div>
		</div>

		<!-- Score bar & Summary Stats (Styled as per Headers page) -->
		<div class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
			<div class="p-4 pb-3">
				<div class="flex items-center justify-between text-xs text-slate-400 mb-2">
					<span class="font-semibold uppercase tracking-wider">Overall SEO Score</span>
					<span class="font-mono text-white font-semibold">${data.score}%</span>
				</div>
				<div class="h-2.5 bg-cyber-elevated rounded-full overflow-hidden border border-white/[0.06]">
					<div class="h-full rounded-full transition-all duration-500" style="width: ${data.score}%; background: ${scoreHex.text};"></div>
				</div>
			</div>
			<div class="grid grid-cols-3 divide-x divide-white/[0.05] border-t border-white/[0.06]">
				<div class="p-4 text-center hover:bg-white/[0.015] transition-colors">
					<span class="text-2xl font-bold font-mono text-emerald-400 block mb-1">${passedCount}</span>
					<span class="text-xs text-slate-400 uppercase font-semibold tracking-wider">Checks Passed</span>
				</div>
				<div class="p-4 text-center hover:bg-white/[0.015] transition-colors">
					<span class="text-2xl font-bold font-mono ${failedCount > 0 ? 'text-amber-400' : 'text-emerald-400'} block mb-1">${failedCount}</span>
					<span class="text-xs text-slate-400 uppercase font-semibold tracking-wider">Issues Found</span>
				</div>
				<div class="p-4 text-center hover:bg-white/[0.015] transition-colors">
					<span class="text-2xl font-bold font-mono ${data.isHTTPS ? 'text-emerald-400' : 'text-red-500'} block mb-1">${data.isHTTPS ? 'HTTPS' : 'HTTP'}</span>
					<span class="text-xs text-slate-400 uppercase font-semibold tracking-wider">Protocol (${data.statusCode})</span>
				</div>
			</div>
		</div>

		<!-- Score by Category (Bars formatted properly, pie chart and passed/issues box removed) -->
		<div class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
			<div class="px-4 py-3 border-b border-white/[0.08] bg-cyber-elevated/40 flex items-center justify-between">
				<h4 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-0 leading-none">Score by Category</h4>
				<span class="text-xs font-mono text-slate-400">${passedCount}/${totalChecks} passed (${passPct}%)</span>
			</div>
			<div class="p-4 space-y-3">`;

	// Compute per-category scores with proper bar formatting
	if (data.checksByCategory) {
		for (const [cat, arr] of Object.entries(data.checksByCategory)) {
			const catChecks = arr;
			const totalW = catChecks.reduce((s, c) => s + c.weight, 0);
			const earnedW = catChecks.filter((c) => c.pass).reduce((s, c) => s + c.weight, 0);
			const catScore = Math.round((earnedW / totalW) * 100);
			const passed = catChecks.filter((c) => c.pass).length;
			const barColor = catScore >= 90 ? '#10b981' : catScore >= 50 ? '#f59e0b' : '#ef4444';
			const accent = catColors[cat] || '#9ca3af';
			html += `<div class="flex items-center gap-3">
				<div class="flex items-center gap-2 shrink-0" style="width: 120px;">
					<span class="w-2 h-2 rounded-full inline-block shrink-0 bg-cyber-accent"></span>
					<span class="text-xs font-semibold text-slate-300 truncate" title="${escapeHtml(cat)}">${escapeHtml(cat)}</span>
				</div>
				<div class="flex-1 h-2 bg-cyber-elevated rounded-full overflow-hidden border border-white/[0.06]">
					<div class="h-full rounded-full transition-all duration-500" style="width:${catScore}%;background:${barColor};"></div>
				</div>
				<span class="text-xs font-bold font-mono text-right shrink-0" style="width: 44px; color:${barColor}">${catScore}%</span>
				<span class="text-xs text-slate-500 text-right shrink-0 font-mono" style="width: 48px;">${passed}/${catChecks.length}</span>
			</div>`;
		}
	}
	html += `</div></div>

`;
	// ---- Meta Tags Section ----
	const m = data.meta;
	html += `<div class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
		<div class="px-4 py-3 border-b border-white/[0.08] bg-cyber-elevated/40 flex items-center justify-between">
			<h4 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-0 leading-none">Meta Tags</h4>
		</div>
		<div class="divide-y divide-white/[0.05]">
			<div class="px-4 py-3 flex items-start gap-2.5 hover:bg-white/[0.015] transition-colors">${m.title ? passIcon : failIcon}<div class="flex-1"><span class="text-xs text-slate-400 font-semibold uppercase tracking-wider">Title</span><div class="text-sm text-white font-medium mt-0.5 break-words">${m.title ? escapeHtml(m.title) : '<span class="text-red-400 font-semibold">Missing</span>'}</div>${m.title ? '<div class="text-xs text-slate-400 mt-1">' + m.titleLength + ' characters' + (m.titleLength > 60 ? ' <span class="text-amber-400 font-medium">(too long)</span>' : m.titleLength < 10 ? ' <span class="text-amber-400 font-medium">(too short)</span>' : ' <span class="text-emerald-400 font-medium">(optimal)</span>') + '</div>' : ''}</div></div>
			<div class="px-4 py-3 flex items-start gap-2.5 hover:bg-white/[0.015] transition-colors">${m.metaDescription ? passIcon : failIcon}<div class="flex-1"><span class="text-xs text-slate-400 font-semibold uppercase tracking-wider">Meta Description</span><div class="text-sm text-slate-300 font-medium mt-0.5 break-words leading-relaxed">${m.metaDescription ? escapeHtml(m.metaDescription.substring(0, 160)) : '<span class="text-red-400 font-semibold">Missing</span>'}</div>${m.metaDescription ? '<div class="text-xs text-slate-400 mt-1">' + m.descriptionLength + ' characters' + (m.descriptionLength > 160 ? ' <span class="text-amber-400 font-medium">(too long)</span>' : m.descriptionLength < 50 ? ' <span class="text-amber-400 font-medium">(too short)</span>' : ' <span class="text-emerald-400 font-medium">(optimal)</span>') + '</div>' : ''}</div></div>
			<div class="px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-white/[0.015] transition-colors"><div class="flex items-center gap-2.5">${m.viewport ? passIcon : failIcon}<span class="text-xs text-slate-400 font-semibold uppercase tracking-wider">Viewport</span></div><span class="text-xs font-mono text-slate-300 font-medium break-all max-w-[65%] text-right">${m.viewport ? escapeHtml(m.viewport.substring(0, 60)) : 'Missing'}</span></div>
			<div class="px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-white/[0.015] transition-colors"><div class="flex items-center gap-2.5">${m.canonical ? passIcon : failIcon}<span class="text-xs text-slate-400 font-semibold uppercase tracking-wider">Canonical</span></div><span class="text-xs font-mono text-slate-300 font-medium break-all max-w-[65%] text-right">${m.canonical ? escapeHtml(m.canonical) : 'Missing'}</span></div>
			<div class="px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-white/[0.015] transition-colors"><div class="flex items-center gap-2.5">${m.lang ? passIcon : failIcon}<span class="text-xs text-slate-400 font-semibold uppercase tracking-wider">Language</span></div><span class="text-xs font-mono text-slate-300 font-medium text-right">${m.lang || 'Missing'}</span></div>
			<div class="px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-white/[0.015] transition-colors"><div class="flex items-center gap-2.5">${m.charset ? passIcon : failIcon}<span class="text-xs text-slate-400 font-semibold uppercase tracking-wider">Charset</span></div><span class="text-xs font-mono text-slate-300 font-medium text-right">${m.charset || 'Missing'}</span></div>
			<div class="px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-white/[0.015] transition-colors"><div class="flex items-center gap-2.5">${m.favicon ? passIcon : failIcon}<span class="text-xs text-slate-400 font-semibold uppercase tracking-wider">Favicon</span></div><span class="text-xs text-slate-300 font-medium text-right">${m.favicon ? 'Found' : 'Missing'}</span></div>
			<div class="px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-white/[0.015] transition-colors"><div class="flex items-center gap-2.5">${m.hasDoctype ? passIcon : failIcon}<span class="text-xs text-slate-400 font-semibold uppercase tracking-wider">DOCTYPE</span></div><span class="text-xs text-slate-300 font-medium text-right">${m.hasDoctype ? 'Present' : 'Missing'}</span></div>
			${m.robotsMeta ? '<div class="px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-white/[0.015] transition-colors"><div class="flex items-center gap-2.5"><svg style="width:14px;height:14px;color:#f97316;flex-shrink:0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01"/></svg><span class="text-xs text-slate-400 font-semibold uppercase tracking-wider">Robots Meta</span></div><span class="text-xs font-mono text-amber-400 font-medium text-right">' + escapeHtml(m.robotsMeta) + '</span></div>' : ''}
		</div>
	</div>`;

	// ---- Headings Structure ----
	if (data.content.headings && data.content.headings.length > 0) {
		html += `<details open class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
			<summary class="px-4 py-3 border-b border-white/[0.08] bg-cyber-elevated/40 cursor-pointer flex items-center justify-between hover:bg-white/[0.02] transition-colors">
				<span class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-0 leading-none">Heading Structure (${data.content.headings.length})</span>
			</summary>
			<div class="divide-y divide-white/[0.05] max-h-[300px] overflow-y-auto">`;
		for (const h of data.content.headings.slice(0, 40)) {
			const level = parseInt(h.tag[1]);
			const indent = (level - 1) * 16;
			const tagColor = level === 1 ? '#fbbf24' : level === 2 ? '#fb923c' : '#9ca3af';
			html += `<div class="px-4 py-2 flex items-center gap-2.5 hover:bg-white/[0.015] transition-colors">
				<span class="text-[11px] font-bold px-2 py-0.5 rounded-md text-center" style="background:${tagColor}22;color:${tagColor}">${h.tag}</span>
				<span class="text-xs text-slate-200" style="margin-left:${indent}px">${escapeHtml(h.text.substring(0, 80))}</span>
			</div>`;
		}
		html += `</div></details>`;
	}

	// ---- Content Analysis ----
	html += `<div class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
		<div class="px-4 py-3 border-b border-white/[0.08] bg-cyber-elevated/40 flex items-center justify-between">
			<h4 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-0 leading-none">Content Analysis</h4>
		</div>
		<div class="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-white/[0.05]">
			<div class="p-4 text-center hover:bg-white/[0.015] transition-colors">
				<span class="text-2xl font-bold font-mono ${data.content.wordCount >= 300 ? 'text-emerald-400' : 'text-amber-400'} block mb-1">${data.content.wordCount}</span>
				<span class="text-xs text-slate-400 uppercase font-semibold tracking-wider block">Words</span>
			</div>
			<div class="p-4 text-center hover:bg-white/[0.015] transition-colors">
				<span class="text-2xl font-bold font-mono text-white block mb-1">${data.content.imagesTotal}</span>
				<span class="text-xs text-slate-400 uppercase font-semibold tracking-wider block">Images</span>
			</div>
			<div class="p-4 text-center hover:bg-white/[0.015] transition-colors">
				<span class="text-2xl font-bold font-mono ${data.content.imagesWithoutAlt === 0 ? 'text-emerald-400' : 'text-red-400'} block mb-1">${data.content.imagesWithoutAlt}</span>
				<span class="text-xs text-slate-400 uppercase font-semibold tracking-wider block">Imgs no alt</span>
			</div>
			<div class="p-4 text-center hover:bg-white/[0.015] transition-colors">
				<span class="text-2xl font-bold font-mono text-white block mb-1">${data.content.headings.length}</span>
				<span class="text-xs text-slate-400 uppercase font-semibold tracking-wider block">Headings</span>
			</div>
		</div>
	</div>`;

	// ---- Keywords ----
	if (data.topKeywords && data.topKeywords.length > 0) {
		const maxCount = data.topKeywords[0].count;
		html += `<details open class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
			<summary class="px-4 py-3 border-b border-white/[0.08] bg-cyber-elevated/40 cursor-pointer flex items-center justify-between hover:bg-white/[0.02] transition-colors">
				<span class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-0 leading-none">Top Keywords (${data.topKeywords.length})</span>
			</summary>
			<div class="p-4">
				<div class="flex flex-wrap gap-2 mb-3.5">`;
		for (const kw of data.topKeywords.slice(0, 15)) {
			const opacity = 0.3 + (kw.count / maxCount) * 0.7;
			html += `<span class="text-xs px-3 py-1 rounded-full font-medium" style="background:rgba(240,86,39,${(opacity * 0.2).toFixed(2)});color:#f05627;border:1px solid rgba(240,86,39,${(opacity * 0.4).toFixed(2)})">${escapeHtml(kw.word)} <span class="text-[10px] text-slate-400 font-mono">${kw.count}x (${kw.density}%)</span></span>`;
		}
		html += `</div>`;
		// Top 8 as table
		html += `<div class="divide-y divide-white/[0.05]">`;
		for (const kw of data.topKeywords.slice(0, 8)) {
			const barW = Math.max(3, (kw.count / maxCount) * 100);
			html += `<div class="py-2 flex items-center gap-3">
				<span class="text-xs font-semibold text-slate-300 w-28 flex-shrink-0">${escapeHtml(kw.word)}</span>
				<div class="flex-1 bg-cyber-elevated border border-white/[0.05] rounded-full h-2 overflow-hidden"><div style="width:${barW}%;background:#f05627;height:100%;border-radius:9999px;opacity:0.8"></div></div>
				<span class="text-xs font-mono text-slate-300 w-10 text-right font-medium">${kw.count}</span>
				<span class="text-xs text-slate-500 w-12 text-right font-mono">${kw.density}%</span>
			</div>`;
		}
		html += `</div></div></details>`;
	}

	// ---- Readability ----
	if (data.readability) {
		const r = data.readability;
		const readColor = r.level === 'Easy' ? '#10b981' : r.level === 'Medium' ? '#eab308' : r.level === 'Hard' ? '#f97316' : '#ef4444';
		html += `<div class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
			<div class="px-4 py-3 border-b border-white/[0.08] bg-cyber-elevated/40 flex items-center justify-between">
				<h4 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-0 leading-none">Readability</h4>
			</div>
			<div class="grid grid-cols-2 md:grid-cols-5 divide-x divide-y md:divide-y-0 divide-white/[0.05]">
				<div class="p-4 text-center hover:bg-white/[0.015] transition-colors">
					<span class="text-xl font-bold font-mono block mb-1" style="color:${readColor}">${r.level}</span>
					<span class="text-xs text-slate-400 uppercase font-semibold tracking-wider block">Level</span>
				</div>
				<div class="p-4 text-center hover:bg-white/[0.015] transition-colors">
					<span class="text-xl font-bold font-mono text-white block mb-1">${r.readabilityIndex}</span>
					<span class="text-xs text-slate-400 uppercase font-semibold tracking-wider block">ARI Score</span>
				</div>
				<div class="p-4 text-center hover:bg-white/[0.015] transition-colors">
					<span class="text-xl font-bold font-mono text-white block mb-1">${r.avgSentenceLength}</span>
					<span class="text-xs text-slate-400 uppercase font-semibold tracking-wider block">Words/Sentence</span>
				</div>
				<div class="p-4 text-center hover:bg-white/[0.015] transition-colors">
					<span class="text-xl font-bold font-mono text-white block mb-1">${r.avgWordLength}</span>
					<span class="text-xs text-slate-400 uppercase font-semibold tracking-wider block">Avg Word Len</span>
				</div>
				<div class="p-4 text-center hover:bg-white/[0.015] transition-colors">
					<span class="text-xl font-bold font-mono text-white block mb-1">${r.sentenceCount}</span>
					<span class="text-xs text-slate-400 uppercase font-semibold tracking-wider block">Sentences</span>
				</div>
			</div>
		</div>`;
	}

	// ---- URL Analysis ----
	if (data.urlAnalysis) {
		const u = data.urlAnalysis;
		html += `<div class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
			<div class="px-4 py-3 border-b border-white/[0.08] bg-cyber-elevated/40 flex items-center justify-between">
				<h4 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-0 leading-none">URL Analysis</h4>
			</div>
			<div class="p-4">
				<div class="text-xs font-mono text-cyber-accent px-3.5 py-2.5 bg-cyber-elevated/50 rounded-xl mb-3.5 border border-white/[0.08] break-all font-medium">${escapeHtml(data.finalUrl)}</div>
				<div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-300">
					<div class="flex items-center gap-2">${u.length <= 100 ? passIcon : failIcon}<span>Length: ${u.length}</span></div>
					<div class="flex items-center gap-2">${!u.hasUppercase ? passIcon : failIcon}<span>${u.hasUppercase ? 'Has uppercase' : 'Lowercase'}</span></div>
					<div class="flex items-center gap-2">${!u.hasUnderscore ? passIcon : failIcon}<span>${u.hasUnderscore ? 'Has underscores' : 'No underscores'}</span></div>
					<div class="flex items-center gap-2">${!u.hasSpecialChars ? passIcon : failIcon}<span>${u.hasSpecialChars ? 'Special chars' : 'Clean chars'}</span></div>
					<div class="flex items-center gap-2"><span class="text-slate-400">Depth: <span class="text-white font-medium">${u.depth}</span></span></div>
					<div class="flex items-center gap-2"><span class="text-slate-400">${u.isClean ? '<span class="text-emerald-400 font-bold">SEO-Friendly URL</span>' : '<span class="text-amber-400 font-medium">Could be improved</span>'}</span></div>
				</div>
			</div>
		</div>`;
	}

	// ---- Page Size & Performance ----
	if (data.pageSize) {
		const ps = data.pageSize;
		const fmtKB = (b) => (b / 1024).toFixed(1) + ' KB';
		html += `<div class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
			<div class="px-4 py-3 border-b border-white/[0.08] bg-cyber-elevated/40 flex items-center justify-between">
				<h4 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-0 leading-none">Page Weight & Resources</h4>
			</div>
			<div class="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-white/[0.05]">
				<div class="p-4 text-center hover:bg-white/[0.015] transition-colors">
					<span class="text-xl font-bold font-mono ${ps.htmlSize < 102400 ? 'text-emerald-400' : 'text-amber-400'} block mb-1">${fmtKB(ps.htmlSize)}</span>
					<span class="text-xs text-slate-400 uppercase font-semibold tracking-wider block">HTML Size</span>
				</div>
				<div class="p-4 text-center hover:bg-white/[0.015] transition-colors">
					<span class="text-xl font-bold font-mono ${ps.textToHtmlRatio >= 10 ? 'text-emerald-400' : 'text-amber-400'} block mb-1">${ps.textToHtmlRatio}%</span>
					<span class="text-xs text-slate-400 uppercase font-semibold tracking-wider block">Text/HTML Ratio</span>
				</div>
				<div class="p-4 text-center hover:bg-white/[0.015] transition-colors">
					<span class="text-xl font-bold font-mono text-white block mb-1">${data.content.externalCSS}</span>
					<span class="text-xs text-slate-400 uppercase font-semibold tracking-wider block">CSS Files</span>
				</div>
				<div class="p-4 text-center hover:bg-white/[0.015] transition-colors">
					<span class="text-xl font-bold font-mono text-white block mb-1">${data.content.externalJS}</span>
					<span class="text-xs text-slate-400 uppercase font-semibold tracking-wider block">JS Files</span>
				</div>
			</div>
			<div class="px-4 py-3 border-t border-white/[0.06] grid grid-cols-2 gap-3 text-xs text-slate-400">
				<div>Inline styles: <span class="text-white font-medium">${data.content.inlineStyles}</span></div>
				<div>Inline scripts: <span class="text-white font-medium">${data.content.inlineScripts}</span></div>
				${data.resourceHints ? '<div>Preconnect: <span class="text-white font-medium">' + data.resourceHints.preconnect.length + '</span></div>' : ''}
				${data.resourceHints ? '<div>Preload: <span class="text-white font-medium">' + data.resourceHints.preload.length + '</span></div>' : ''}
			</div>
		</div>`;
	}

	// ---- Redirect & Mixed Content ----
	if (
		data.wasRedirected ||
		(data.mixedContent && data.mixedContent.length > 0) ||
		(data.deprecatedTags && data.deprecatedTags.length > 0)
	) {
		html += `<div class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
			<div class="px-4 py-3 border-b border-white/[0.08] bg-cyber-elevated/40 flex items-center justify-between">
				<h4 class="text-sm font-bold text-red-400 uppercase tracking-wider mb-0 leading-none">Issues & Warnings</h4>
			</div>
			<div class="divide-y divide-white/[0.05]">`;
		if (data.wasRedirected) {
			html += `<div class="px-4 py-3 flex items-center gap-2.5 hover:bg-white/[0.015] transition-colors"><svg style="width:14px;height:14px;color:#f97316;flex-shrink:0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg><span class="text-xs text-amber-400 font-semibold">Redirect detected</span><span class="text-xs font-mono text-slate-400 ml-auto truncate max-w-[60%]">${escapeHtml(data.redirectTarget || '')}</span></div>`;
		}
		if (data.mixedContent && data.mixedContent.length > 0) {
			html += `<div class="px-4 py-3 flex items-center gap-2.5 hover:bg-white/[0.015] transition-colors">${failIcon}<span class="text-xs text-red-400 font-medium">${data.mixedContent.length} mixed content resource(s) (HTTP on HTTPS)</span></div>`;
		}
		if (data.deprecatedTags && data.deprecatedTags.length > 0) {
			html += `<div class="px-4 py-3 flex items-center gap-2.5 hover:bg-white/[0.015] transition-colors">${failIcon}<span class="text-xs text-red-400 font-medium">Deprecated HTML tags: <span class="font-mono text-slate-300 font-medium">${data.deprecatedTags.join(', ')}</span></span></div>`;
		}
		html += `</div></div>`;
	}

	// ---- Accessibility ----
	if (data.accessibility) {
		const a = data.accessibility;
		html += `<div class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
			<div class="px-4 py-3 border-b border-white/[0.08] bg-cyber-elevated/40 flex items-center justify-between">
				<h4 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-0 leading-none">Accessibility</h4>
			</div>
			<div class="divide-y divide-white/[0.05]">
				<div class="px-4 py-2.5 flex items-center gap-2.5 hover:bg-white/[0.015] transition-colors">${a.hasLang ? passIcon : failIcon}<span class="text-xs text-slate-300 font-medium">HTML lang attribute</span></div>
				<div class="px-4 py-2.5 flex items-center gap-2.5 hover:bg-white/[0.015] transition-colors">${a.hasSkipNav ? passIcon : failIcon}<span class="text-xs text-slate-300 font-medium">Skip navigation link</span></div>
				<div class="px-4 py-2.5 flex items-center gap-2.5 hover:bg-white/[0.015] transition-colors">${a.hasAriaLandmarks ? passIcon : failIcon}<span class="text-xs text-slate-300 font-medium">ARIA landmarks / semantic HTML5</span></div>
				<div class="px-4 py-2.5 flex items-center gap-2.5 hover:bg-white/[0.015] transition-colors">${a.formsHaveLabels ? passIcon : failIcon}<span class="text-xs text-slate-300 font-medium">Form labels</span></div>
				<div class="px-4 py-2.5 flex items-center gap-2.5 hover:bg-white/[0.015] transition-colors"><span class="text-xs text-slate-400">ARIA attributes: <span class="text-white font-medium">${a.ariaAttributes}</span></span><span class="text-xs text-slate-400 ml-4">role attributes: <span class="text-white font-medium">${a.roleAttributes}</span></span></div>
			</div>
		</div>`;
	}

	// ---- HTTP Headers (SEO-relevant) ----
	if (data.seoHeaders) {
		html += `<details class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
			<summary class="px-4 py-3 border-b border-white/[0.08] bg-cyber-elevated/40 cursor-pointer flex items-center justify-between hover:bg-white/[0.02] transition-colors">
				<span class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-0 leading-none">HTTP Response Headers</span>
			</summary>
			<div class="divide-y divide-white/[0.05]">`;
		for (const [key, val] of Object.entries(data.seoHeaders)) {
			if (val) {
				html += `<div class="px-4 py-2.5 flex items-center gap-3 hover:bg-white/[0.015] transition-colors">
					<span class="text-xs text-slate-400 font-semibold uppercase tracking-wider w-44 flex-shrink-0">${escapeHtml(key)}</span>
					<span class="text-xs font-mono text-slate-300 font-medium truncate flex-1 min-w-0">${escapeHtml(String(val).substring(0, 100))}</span>
				</div>`;
			}
		}
		html += `</div></details>`;
	}

	// ---- Open Graph & Twitter Cards ----
	const og = data.openGraph;
	const tw = data.twitterCard;
	const hasOG = og.title || og.description || og.image;
	const hasTW = tw.card || tw.title;
	html += `<div class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
		<div class="px-4 py-3 border-b border-white/[0.08] bg-cyber-elevated/40 flex items-center justify-between">
			<h4 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-0 leading-none">Social Preview</h4>
		</div>
		<div class="p-4">
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<!-- OG Preview -->
				<div class="border border-white/[0.08] rounded-xl overflow-hidden bg-cyber-elevated/30">
					<div class="px-3.5 py-2 border-b border-white/[0.06] bg-cyber-elevated/40">
						<span class="text-xs font-bold text-cyber-accent uppercase tracking-wider">Open Graph</span>
					</div>
					${og.image ? '<img src="' + escapeHtml(og.image) + '" style="width:100%;max-height:120px;object-fit:cover" onerror="this.style.display=\'none\'" />' : ''}
					<div class="p-3">
						<div class="text-sm font-bold text-white">${og.title ? escapeHtml(og.title) : '<span class="text-slate-500">No og:title</span>'}</div>
						<div class="text-xs text-slate-300 mt-1 leading-relaxed">${og.description ? escapeHtml(og.description.substring(0, 100)) : '<span class="text-slate-500">No og:description</span>'}</div>
						${og.siteName ? '<div class="text-[11px] text-slate-400 mt-1.5">' + escapeHtml(og.siteName) + '</div>' : ''}
					</div>
				</div>
				<!-- Twitter Preview -->
				<div class="border border-white/[0.08] rounded-xl overflow-hidden bg-cyber-elevated/30">
					<div class="px-3.5 py-2 border-b border-white/[0.06] bg-cyber-elevated/40 flex items-center justify-between">
						<span class="text-xs font-bold text-cyber-accent uppercase tracking-wider">Twitter Card</span>
						${tw.card ? '<span class="text-[11px] text-slate-400 font-mono">(' + escapeHtml(tw.card) + ')</span>' : ''}
					</div>
					${tw.image ? '<img src="' + escapeHtml(tw.image) + '" style="width:100%;max-height:120px;object-fit:cover" onerror="this.style.display=\'none\'" />' : ''}
					<div class="p-3">
						<div class="text-sm font-bold text-white">${tw.title ? escapeHtml(tw.title) : '<span class="text-slate-500">No twitter:title</span>'}</div>
						<div class="text-xs text-slate-300 mt-1 leading-relaxed">${tw.description ? escapeHtml(tw.description.substring(0, 100)) : '<span class="text-slate-500">No twitter:description</span>'}</div>
					</div>
				</div>
			</div>
		</div>
	</div>`;

	// ---- Structured Data ----
	html += `<div class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
		<div class="px-4 py-3 border-b border-white/[0.08] bg-cyber-elevated/40 flex items-center justify-between">
			<h4 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-0 leading-none">Structured Data (JSON-LD)</h4>
		</div>`;
	if (data.structuredData.length > 0) {
		html += `<div class="divide-y divide-white/[0.05]">`;
		for (const sd of data.structuredData) {
			html += `<div class="px-4 py-2.5 flex items-center gap-2.5 hover:bg-white/[0.015] transition-colors">${passIcon}
				<span class="text-[11px] font-bold px-2 py-0.5 rounded-md bg-cyber-accent/10 text-cyber-accent border border-cyber-accent/30 whitespace-nowrap">${escapeHtml(sd.type)}</span>
				<span class="text-xs text-slate-300 font-mono truncate flex-1 min-w-0 font-medium">${escapeHtml(sd.summary.substring(0, 120))}</span>
			</div>`;
		}
		html += `</div>`;
	} else {
		html += `<div class="px-4 py-3 flex items-center gap-2">${failIcon}<span class="text-xs text-slate-400">No structured data (JSON-LD) found — consider adding Schema.org markup</span></div>`;
	}
	html += `</div>`;

	// ---- Robots.txt ----
	html += `<div class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
		<div class="px-4 py-3 border-b border-white/[0.08] bg-cyber-elevated/40 flex items-center justify-between">
			<h4 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-0 leading-none">Robots.txt</h4>
		</div>`;
	if (data.robots.exists) {
		html += `<div class="p-4 space-y-2.5">
			<div class="flex items-center gap-2">${passIcon}<span class="text-sm text-white font-semibold">robots.txt found</span></div>`;
		if (data.robots.userAgents.length > 0) {
			html += `<div class="text-xs text-slate-300"><span class="text-slate-400 font-medium">User-Agents: </span>${data.robots.userAgents.map((u) => '<span class="font-mono text-white font-medium">' + escapeHtml(u) + '</span>').join(', ')}</div>`;
		}
		if (data.robots.disallowedPaths.length > 0) {
			html += `<details><summary class="text-xs text-amber-400 cursor-pointer font-medium">${data.robots.disallowedPaths.length} disallowed paths</summary><div class="py-2 text-xs font-mono text-slate-300 leading-relaxed">${data.robots.disallowedPaths.map((p) => escapeHtml(p)).join('<br>')}</div></details>`;
		}
		if (data.robots.sitemapUrls.length > 0) {
			html += `<div class="text-xs text-slate-300"><span class="text-slate-400 font-medium">Sitemaps in robots.txt: </span>${data.robots.sitemapUrls.map((u) => '<span class="font-mono text-cyber-accent font-medium">' + escapeHtml(u) + '</span>').join('<br>')}</div>`;
		}
		if (data.robots.crawlDelay !== null) {
			html += `<div class="text-xs text-amber-400 font-medium">Crawl-delay: ${data.robots.crawlDelay}s</div>`;
		}
		html += `</div>`;
	} else {
		html += `<div class="px-4 py-3 flex items-center gap-2">${failIcon}<span class="text-xs text-slate-400">No robots.txt found</span></div>`;
	}
	html += `</div>`;

	// ---- Sitemap ----
	html += `<div class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
		<div class="px-4 py-3 border-b border-white/[0.08] bg-cyber-elevated/40 flex items-center justify-between">
			<h4 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-0 leading-none">Sitemap</h4>
		</div>`;
	if (data.sitemap.exists) {
		html += `<div class="p-4 space-y-2.5">
			<div class="flex items-center gap-2">${passIcon}<span class="text-sm text-white font-semibold">Sitemap found</span><span class="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">${escapeHtml(data.sitemap.format || 'XML')}</span></div>
			<div class="text-xs text-slate-300"><span class="font-bold text-white font-mono">${data.sitemap.urls}</span> URLs indexed</div>`;
		if (data.sitemap.lastmod) {
			html += `<div class="text-xs text-slate-400">Last modified: <span class="text-white font-mono">${escapeHtml(data.sitemap.lastmod)}</span></div>`;
		}
		if (data.sitemap.nestedSitemaps.length > 0) {
			html += `<details><summary class="text-xs text-cyber-accent cursor-pointer font-medium">${data.sitemap.nestedSitemaps.length} nested sitemaps</summary><div class="py-2 text-xs font-mono text-slate-400 break-all leading-relaxed">${data.sitemap.nestedSitemaps.map((u) => escapeHtml(u)).join('<br>')}</div></details>`;
		}
		if (data.sitemap.sampleUrls.length > 0) {
			html += `<details><summary class="text-xs text-slate-400 cursor-pointer font-medium">Sample URLs (${data.sitemap.sampleUrls.length})</summary><div class="py-2 text-xs font-mono text-slate-400 break-all leading-relaxed">${data.sitemap.sampleUrls.map((u) => escapeHtml(u)).join('<br>')}</div></details>`;
		}
		html += `</div>`;
	} else {
		html += `<div class="px-4 py-3 flex items-center gap-2">${failIcon}<span class="text-xs text-slate-400">No sitemap found — create a sitemap.xml for better search engine crawling</span></div>`;
	}
	html += `</div>`;

	// ---- Links Analysis ----
	html += `<div class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
		<div class="px-4 py-3 border-b border-white/[0.08] bg-cyber-elevated/40 flex items-center justify-between">
			<h4 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-0 leading-none">Links Analysis</h4>
		</div>
		<div class="grid grid-cols-3 md:grid-cols-6 divide-x divide-y md:divide-y-0 divide-white/[0.05]">
			<div class="p-4 text-center hover:bg-white/[0.015] transition-colors">
				<span class="text-xl font-bold font-mono text-white block mb-1">${data.links.internalCount}</span>
				<span class="text-xs text-slate-400 uppercase font-semibold tracking-wider block">Internal</span>
			</div>
			<div class="p-4 text-center hover:bg-white/[0.015] transition-colors">
				<span class="text-xl font-bold font-mono text-white block mb-1">${data.links.externalCount}</span>
				<span class="text-xs text-slate-400 uppercase font-semibold tracking-wider block">External</span>
			</div>
			<div class="p-4 text-center hover:bg-white/[0.015] transition-colors">
				<span class="text-xl font-bold font-mono ${(data.links.nofollowInternal || 0) > 0 ? 'text-amber-400' : 'text-emerald-400'} block mb-1">${data.links.nofollowInternal || 0}</span>
				<span class="text-xs text-slate-400 uppercase font-semibold tracking-wider block">Nofollow Int.</span>
			</div>
			<div class="p-4 text-center hover:bg-white/[0.015] transition-colors">
				<span class="text-xl font-bold font-mono text-white block mb-1">${data.links.nofollowExternal || 0}</span>
				<span class="text-xs text-slate-400 uppercase font-semibold tracking-wider block">Nofollow Ext.</span>
			</div>
			<div class="p-4 text-center hover:bg-white/[0.015] transition-colors">
				<span class="text-xl font-bold font-mono ${(data.links.emptyLinks || 0) > 0 ? 'text-red-400' : 'text-emerald-400'} block mb-1">${data.links.emptyLinks || 0}</span>
				<span class="text-xs text-slate-400 uppercase font-semibold tracking-wider block">Empty Text</span>
			</div>
			<div class="p-4 text-center hover:bg-white/[0.015] transition-colors">
				<span class="text-xl font-bold font-mono text-white block mb-1">${data.links.internalCount + data.links.externalCount}</span>
				<span class="text-xs text-slate-400 uppercase font-semibold tracking-wider block">Total</span>
			</div>
		</div>`;
	if (data.links.internalLinks.length > 0) {
		html += `<details><summary class="px-4 py-2.5 cursor-pointer text-xs font-semibold text-cyber-accent border-t border-white/[0.06] bg-cyber-elevated/20 hover:bg-white/[0.02] transition-colors">Internal links (${data.links.internalLinks.length})</summary>
			<div class="divide-y divide-white/[0.05] max-h-[200px] overflow-y-auto">`;
		for (const l of data.links.internalLinks.slice(0, 30)) {
			html += `<div class="px-4 py-2 flex items-center gap-3 hover:bg-white/[0.015] transition-colors">
				<span class="text-xs font-mono text-cyber-accent flex-1 truncate font-medium">${escapeHtml(l.url)}</span>
				<span class="text-xs text-slate-400 flex-shrink-0">${escapeHtml(l.text.substring(0, 40)) || '<em>empty</em>'}</span>
				${l.nofollow ? '<span class="text-[10px] text-amber-400 font-bold uppercase font-mono">nofollow</span>' : ''}
			</div>`;
		}
		html += `</div></details>`;
	}
	if (data.links.externalLinks.length > 0) {
		html += `<details><summary class="px-4 py-2.5 cursor-pointer text-xs font-semibold text-amber-400 border-t border-white/[0.06] bg-cyber-elevated/20 hover:bg-white/[0.02] transition-colors">External links (${data.links.externalLinks.length})</summary>
			<div class="divide-y divide-white/[0.05] max-h-[200px] overflow-y-auto">`;
		for (const l of data.links.externalLinks.slice(0, 20)) {
			html += `<div class="px-4 py-2 flex items-center gap-3 hover:bg-white/[0.015] transition-colors">
				<span class="text-xs font-mono text-amber-400 flex-1 truncate font-medium">${escapeHtml(l.url)}</span>
				${l.nofollow ? '<span class="text-[10px] text-amber-400 font-bold uppercase font-mono">nofollow</span>' : ''}
				${l.hasTarget ? '<span class="text-[10px] text-slate-500 font-mono">_blank</span>' : ''}
			</div>`;
		}
		html += `</div></details>`;
	}
	html += `</div>`;

	// ---- Crawled Pages ----
	if (data.crawledPages && data.crawledPages.length > 0) {
		html += `<details open class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
			<summary class="px-4 py-3 border-b border-white/[0.08] bg-cyber-elevated/40 cursor-pointer flex items-center justify-between hover:bg-white/[0.02] transition-colors">
				<span class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-0 leading-none">Page Analysis (${data.crawledPages.length} pages crawled)</span>
			</summary>
			<div class="divide-y divide-white/[0.05]">`;
		for (const page of data.crawledPages) {
			const issueCount = page.issues.length;
			const pageColor = issueCount === 0 ? 'text-emerald-400' : issueCount <= 2 ? 'text-amber-400' : 'text-red-400';
			html += `<div class="px-4 py-3 hover:bg-white/[0.015] transition-colors">
				<div class="flex items-center gap-2.5 mb-1.5">
					<span class="text-[11px] font-bold px-2 py-0.5 rounded-md ${page.statusCode === 200 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/15 text-red-400 border border-red-500/30'} font-mono">${page.statusCode}</span>
					<span class="text-xs font-mono text-white truncate flex-1 font-medium">${escapeHtml(page.url)}</span>
					<span class="text-xs ${pageColor} font-bold whitespace-nowrap">${issueCount === 0 ? 'OK' : issueCount + ' issue' + (issueCount > 1 ? 's' : '')}</span>
				</div>`;
			if (page.title)
				html += `<div class="text-xs text-slate-400">Title: <span class="text-slate-200 font-medium">${escapeHtml(page.title.substring(0, 60))}</span></div>`;
			if (page.h1)
				html += `<div class="text-xs text-slate-400">H1: <span class="text-slate-200 font-medium">${escapeHtml(page.h1.substring(0, 60))}</span></div>`;
			html += `<div class="text-xs text-slate-500 font-mono mt-0.5">${page.wordCount} words</div>`;
			if (page.issues.length > 0) {
				html += `<div class="flex flex-wrap gap-1.5 mt-2">`;
				for (const iss of page.issues) {
					html += `<span class="text-[11px] font-bold px-2 py-0.5 rounded-md bg-red-500/15 text-red-400 border border-red-500/30">${escapeHtml(iss)}</span>`;
				}
				html += `</div>`;
			}
			html += `</div>`;
		}
		html += `</div></details>`;
	}

	// ---- Hreflang ----
	if (data.hreflangs && data.hreflangs.length > 0) {
		html += `<div class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
			<div class="px-4 py-3 border-b border-white/[0.08] bg-cyber-elevated/40 flex items-center justify-between">
				<h4 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-0 leading-none">Hreflang Tags (${data.hreflangs.length})</h4>
			</div>
			<div class="divide-y divide-white/[0.05]">`;
		for (const h of data.hreflangs) {
			html += `<div class="px-4 py-2.5 flex items-center gap-3 hover:bg-white/[0.015] transition-colors">
				<span class="text-[11px] font-bold px-2 py-0.5 rounded-md bg-cyber-accent/10 text-cyber-accent border border-cyber-accent/30 font-mono">${escapeHtml(h.lang)}</span>
				<span class="text-xs font-mono text-slate-300 truncate flex-1 min-w-0 font-medium">${escapeHtml(h.url)}</span>
			</div>`;
		}
		html += `</div></div>`;
	}

	// ---- Social Links ----
	if (data.socialLinks && data.socialLinks.length > 0) {
		html += `<div class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
			<div class="px-4 py-3 border-b border-white/[0.08] bg-cyber-elevated/40 flex items-center justify-between">
				<h4 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-0 leading-none">Social Media Links (${data.socialLinks.length})</h4>
			</div>
			<div class="p-4 flex flex-wrap gap-2.5">`;
		for (const sl of data.socialLinks) {
			let rawUrl = (sl.url || '').trim();
			if (rawUrl && !/^https?:\/\//i.test(rawUrl)) {
				rawUrl = 'https://' + rawUrl.replace(/^\/+/, '');
			}
			const href = rawUrl ? escapeHtml(rawUrl) : '#';
			html += `<a href="${href}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-cyber-accent/10 hover:bg-cyber-accent/20 text-cyber-accent hover:text-white border border-cyber-accent/30 hover:border-cyber-accent/50 font-semibold transition-all shadow-none" title="${href}">
				<span>${escapeHtml(sl.name)}</span>
				<svg class="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
			</a>`;
		}
		html += `</div></div>`;
	}

	// ---- Detailed Check Results ----
	html += `<details open class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
		<summary class="px-4 py-3 border-b border-white/[0.08] bg-cyber-elevated/40 cursor-pointer flex items-center justify-between hover:bg-white/[0.02] transition-colors">
			<span class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-0 leading-none">All Checks (${data.checks.filter((c) => c.pass).length}/${data.checks.length} passed)</span>
		</summary>`;
	if (data.checksByCategory) {
		for (const [cat, arr] of Object.entries(data.checksByCategory)) {
			const cc = catColors[cat] || '#9ca3af';
			const catChecks = arr;
			const passed = catChecks.filter((c) => c.pass).length;
			html += `<div class="border-b border-white/[0.06] last:border-b-0">
				<div class="px-4 py-2.5 flex items-center justify-between bg-cyber-elevated/30">
					<span class="text-xs font-bold uppercase tracking-wider text-cyber-accent">${cat}</span>
					<span class="text-xs font-mono font-bold ${passed === catChecks.length ? 'text-emerald-400' : 'text-amber-400'}">${passed}/${catChecks.length}</span>
				</div>
				<div class="divide-y divide-white/[0.05]">`;
			for (const c of catChecks) {
				html += `<div class="px-4 py-2 flex items-center gap-2.5 hover:bg-white/[0.015] transition-colors">${c.pass ? passIcon : failIcon}<span class="text-xs font-medium ${c.pass ? 'text-slate-200' : 'text-red-400'}">${escapeHtml(c.label)}</span><span class="text-xs text-slate-400 ml-auto max-w-[50%] truncate text-right font-medium">${escapeHtml(c.detail.substring(0, 80))}</span></div>`;
			}
			html += `</div></div>`;
		}
	}
	html += `</details>`;

	// Footer
	html += `<div class="text-center text-xs text-slate-500 mt-3 mb-2 font-mono">
		Tested at ${new Date(data.timestamp).toLocaleString()}
	</div>`;

	html += `</div>`;
	resultsDiv.innerHTML = html;
}


// Expose to window for global access
window.lastSEOData = lastSEOData;
window.runSEOTest = runSEOTest;
window.displaySEOResults = displaySEOResults;
