/**
 * WAF-Checker - Full Reconnaissance Module
 */

var lastFullReconData = null;
var lastDNSReconData = null;

// DNS Recon is now merged into Full Recon — see displayFullReconResults

function displayDNSReconResults(data) {
	// Legacy — redirect to full recon display
	lastDNSReconData = data;
	const resultsDiv = document.getElementById('results');

	let html = `<div class="p-4">
		<!-- Header -->
		<div class="flex items-center justify-between mb-4 p-4 bg-cyber-accent/10 border border-cyber-accent/30 rounded-xl">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 rounded-lg bg-cyber-accent/20 flex items-center justify-center">
					<svg class="w-5 h-5 text-cyber-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
					</svg>
				</div>
				<div>
					<h3 class="text-sm font-bold text-cyber-accent">Target Intelligence</h3>
					<p class="text-xs text-gray-400">DNS Reconnaissance & WHOIS — <span class="text-white font-mono">${escapeHtml(data.hostname)}</span></p>
				</div>
			</div>
			<div class="flex items-center gap-1">
				<button onclick="exportReconJSON('dns')" class="text-xs bg-[#181923] hover:bg-[#20212d] border border-white/[0.08] hover:border-white/[0.18] text-slate-300 hover:text-white px-3 py-1 rounded-[10px] transition-all font-semibold shadow-none" title="Export JSON">JSON</button>
				<button onclick="exportReconHTML('dns')" class="text-xs bg-[#181923] hover:bg-[#20212d] border border-white/[0.08] hover:border-white/[0.18] text-slate-300 hover:text-white px-3 py-1 rounded-[10px] transition-all font-semibold shadow-none" title="Export HTML">HTML</button>
				<button onclick="exportReconScreenshot(event)" class="text-xs bg-[#181923] hover:bg-[#20212d] border border-white/[0.08] hover:border-white/[0.18] text-slate-300 hover:text-white px-2 py-1 rounded-[10px] transition-all shadow-none" title="Screenshot">
					<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
				</button>
			</div>
		</div>

		<!-- IP Addresses -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
			<div class="bg-cyber-card border border-cyber-accent/20 rounded-xl overflow-hidden">
				<div class="px-4 py-2.5 border-b border-cyber-accent/20 bg-cyber-elevated/30">
					<h4 class="text-xs font-bold text-cyber-accent uppercase tracking-wider">IPv4 Addresses</h4>
				</div>
				<div class="p-3 space-y-1">
					${data.ipAddresses.length > 0 ? data.ipAddresses.map((ip) => `<code class="block text-sm font-mono text-white">${escapeHtml(ip)}</code>`).join('') : '<span class="text-xs text-gray-500">None found</span>'}
				</div>
			</div>
			<div class="bg-cyber-card border border-cyber-accent/20 rounded-xl overflow-hidden">
				<div class="px-4 py-2.5 border-b border-cyber-accent/20 bg-cyber-elevated/30">
					<h4 class="text-xs font-bold text-cyber-accent uppercase tracking-wider">IPv6 Addresses</h4>
				</div>
				<div class="p-3 space-y-1">
					${data.ipv6Addresses.length > 0 ? data.ipv6Addresses.map((ip) => `<code class="block text-xs font-mono text-white break-all">${escapeHtml(ip)}</code>`).join('') : '<span class="text-xs text-gray-500">None found</span>'}
				</div>
			</div>
		</div>`;

	// Domain WHOIS (RDAP) — legacy (DNS Recon merged into Full Recon)
	if (data.domainWhois) {
		// Redirect to Full Recon display for consistency
	}

	// Infrastructure detection
	if (data.infrastructure && data.infrastructure.length > 0) {
		html += `<div class="bg-cyber-card border border-cyber-accent/20 rounded-xl overflow-hidden mb-4">
			<div class="px-4 py-2.5 border-b border-cyber-accent/20 bg-cyber-accent/5">
				<h4 class="text-xs font-bold text-cyber-accent uppercase tracking-wider">Detected Infrastructure</h4>
			</div>
			<div class="p-3 space-y-2">`;
		for (const infra of data.infrastructure) {
			html += `<div class="flex items-center gap-3 px-3 py-2 bg-cyber-elevated/50 rounded-lg">
				<span class="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-cyber-accent/20 text-cyber-accent border border-cyber-accent/30">${escapeHtml(infra.type)}</span>
				<span class="text-sm font-bold text-white">${escapeHtml(infra.provider)}</span>
				<span class="text-[10px] text-gray-500 ml-auto">${escapeHtml(infra.evidence)}</span>
			</div>`;
		}
		html += `</div></div>`;
	}

	// WHOIS data
	if (data.whois && data.whois.status === 'success') {
		const w = data.whois;
		html += `<div class="bg-cyber-card border border-cyber-accent/20 rounded-xl overflow-hidden mb-4">
			<div class="px-4 py-2.5 border-b border-cyber-accent/20 bg-cyber-elevated/30">
				<h4 class="text-xs font-bold text-cyber-accent uppercase tracking-wider">IP WHOIS — ${escapeHtml(w.query)}</h4>
			</div>
			<div class="grid grid-cols-2 gap-px bg-cyber-accent/10">
				<div class="bg-cyber-card p-3"><span class="text-[10px] text-gray-500 uppercase block">ISP</span><span class="text-sm text-white">${escapeHtml(w.isp || 'N/A')}</span></div>
				<div class="bg-cyber-card p-3"><span class="text-[10px] text-gray-500 uppercase block">Organization</span><span class="text-sm text-white">${escapeHtml(w.org || 'N/A')}</span></div>
				<div class="bg-cyber-card p-3"><span class="text-[10px] text-gray-500 uppercase block">AS Number</span><span class="text-sm text-white font-mono">${escapeHtml(w.as || 'N/A')}</span></div>
				<div class="bg-cyber-card p-3"><span class="text-[10px] text-gray-500 uppercase block">AS Name</span><span class="text-sm text-white">${escapeHtml(w.asname || 'N/A')}</span></div>
				<div class="bg-cyber-card p-3"><span class="text-[10px] text-gray-500 uppercase block">Country</span><span class="text-sm text-white">${escapeHtml(w.country || 'N/A')} (${escapeHtml(w.countryCode || '')})</span></div>
				<div class="bg-cyber-card p-3"><span class="text-[10px] text-gray-500 uppercase block">City</span><span class="text-sm text-white">${escapeHtml(w.city || 'N/A')}, ${escapeHtml(w.regionName || '')}</span></div>
				<div class="bg-cyber-card p-3"><span class="text-[10px] text-gray-500 uppercase block">Reverse DNS (PTR)</span><span class="text-xs font-mono break-all ${data.reverseDns ? 'text-cyber-accent' : 'text-gray-600'}">${escapeHtml(data.reverseDns || w.reverse || 'N/A')}</span></div>
				<div class="bg-cyber-card p-3"><span class="text-[10px] text-gray-500 uppercase block">Timezone</span><span class="text-sm text-white">${escapeHtml(w.timezone || 'N/A')}</span></div>
			</div>
		</div>`;
	}

	// Nameservers
	if (data.nameservers && data.nameservers.length > 0) {
		html += `<div class="bg-cyber-card border border-cyber-accent/20 rounded-xl overflow-hidden mb-4">
			<div class="px-4 py-2.5 border-b border-cyber-accent/20 bg-cyber-elevated/30">
				<h4 class="text-xs font-bold text-cyber-accent uppercase tracking-wider">Nameservers</h4>
			</div>
			<div class="p-3 space-y-1">
				${data.nameservers.map((ns) => `<code class="block text-sm font-mono text-white">${escapeHtml(ns)}</code>`).join('')}
			</div>
		</div>`;
	}

	// Mail servers
	if (data.mailServers && data.mailServers.length > 0) {
		html += `<div class="bg-cyber-card border border-cyber-accent/20 rounded-xl overflow-hidden mb-4">
			<div class="px-4 py-2.5 border-b border-cyber-accent/20 bg-cyber-elevated/30">
				<h4 class="text-xs font-bold text-cyber-accent uppercase tracking-wider">Mail Servers (MX)</h4>
			</div>
			<div class="p-3 space-y-1">
				${data.mailServers.map((mx) => `<div class="flex items-center gap-3"><span class="text-[10px] text-gray-500 font-mono w-8">P:${mx.priority}</span><code class="text-sm font-mono text-white">${escapeHtml(mx.server)}</code></div>`).join('')}
			</div>
		</div>`;
	}

	// Email security
	if (data.emailSecurity) {
		const es = data.emailSecurity;
		html += `<div class="bg-cyber-card border border-cyber-accent/20 rounded-xl overflow-hidden mb-4">
			<div class="px-4 py-2.5 border-b border-cyber-accent/20 bg-cyber-elevated/30">
				<h4 class="text-xs font-bold text-cyber-accent uppercase tracking-wider">Email Security</h4>
			</div>
			<div class="p-3 space-y-2">
				<div class="flex items-center gap-2">
					<span class="w-2 h-2 rounded-full ${es.hasSPF ? 'bg-cyber-success' : 'bg-cyber-danger'}"></span>
					<span class="text-xs ${es.hasSPF ? 'text-cyber-success' : 'text-cyber-danger'} font-bold">SPF</span>
					<code class="text-[10px] text-gray-500 font-mono ml-2 break-all">${es.spf ? escapeHtml(es.spf) : 'Not configured'}</code>
				</div>
				<div class="flex items-center gap-2">
					<span class="w-2 h-2 rounded-full ${es.hasDMARC ? 'bg-cyber-success' : 'bg-cyber-danger'}"></span>
					<span class="text-xs ${es.hasDMARC ? 'text-cyber-success' : 'text-cyber-danger'} font-bold">DMARC</span>
					<code class="text-[10px] text-gray-500 font-mono ml-2 break-all">${es.dmarc ? escapeHtml(es.dmarc) : 'Not configured'}</code>
				</div>
			</div>
		</div>`;
	}

	// TXT Records
	if (data.txtRecords && data.txtRecords.length > 0) {
		html += `<details open class="bg-cyber-card border border-cyber-accent/20 rounded-xl overflow-hidden mb-4">
			<summary class="px-4 py-2.5 bg-cyber-elevated/30 cursor-pointer text-xs font-bold text-gray-400 uppercase tracking-wider hover:text-white transition-colors">
				TXT Records (${data.txtRecords.length})
			</summary>
			<div class="p-3 space-y-1 max-h-48 overflow-y-auto">
				${data.txtRecords.map((txt) => `<code class="block text-[10px] font-mono text-gray-400 break-all py-1 border-b border-cyber-accent/5">${escapeHtml(txt)}</code>`).join('')}
			</div>
		</details>`;
	}

	// Subdomains
	if (data.subdomains && data.subdomains.length > 0) {
		const stats = data.subdomainStats || {};
		html += `<div class="bg-cyber-card border border-emerald-500/20 rounded-xl overflow-hidden mb-4">
			<div class="px-4 py-2.5 border-b border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between">
				<h4 class="text-xs font-bold text-emerald-400 uppercase tracking-wider">Discovered Subdomains (${data.subdomains.length})</h4>
				<div class="flex gap-2">
					${stats.fromCT ? `<span class="text-[9px] px-1.5 py-0.5 rounded bg-cyber-accent/15 text-cyber-accent border border-cyber-accent/30 font-bold">CT: ${stats.fromCT}</span>` : ''}
					${stats.fromDNS ? `<span class="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">DNS: ${stats.fromDNS}</span>` : ''}
				</div>
			</div>
			<div class="max-h-80 overflow-y-auto divide-y divide-cyber-accent/10">`;
		for (const sub of data.subdomains) {
			const srcColor =
				sub.source === 'DNS + CT'
					? 'text-cyber-accent bg-cyber-accent/10 border-cyber-accent/30'
					: sub.source === 'DNS'
						? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
						: 'text-cyber-accent bg-cyber-accent/10 border-cyber-accent/30';
			html += `<div class="flex items-center justify-between px-4 py-1.5 hover:bg-cyber-elevated/30 transition-colors">
				<div class="flex items-center gap-2 min-w-0">
					<span class="w-1.5 h-1.5 rounded-full ${sub.ip ? 'bg-emerald-400' : 'bg-gray-600'} flex-shrink-0"></span>
					<code class="text-xs font-mono text-white whitespace-nowrap">${escapeHtml(sub.name)}</code>
				</div>
				<div class="flex items-center gap-2 flex-shrink-0 ml-2">
					${sub.ip ? `<code class="text-[10px] font-mono text-gray-400 whitespace-nowrap">${escapeHtml(sub.ip)}</code>` : '<span class="text-[10px] text-gray-600 whitespace-nowrap">no A record</span>'}
					<span class="text-[8px] px-1 py-0.5 rounded border ${srcColor} font-bold whitespace-nowrap">${escapeHtml(sub.source)}</span>
				</div>
			</div>`;
		}
		html += `</div></div>`;
	} else if (data.subdomains) {
		html += `<div class="bg-cyber-card border border-gray-500/20 rounded-xl p-4 mb-4 text-center">
			<p class="text-gray-500 text-xs">No subdomains discovered via Certificate Transparency or DNS brute-force</p>
		</div>`;
	}

	// Reverse IP (other domains on same IP) — at the end
	if (data.reverseIpDomains && data.reverseIpDomains.length > 0) {
		const domains = data.reverseIpDomains;
		const targetHost = data.hostname?.toLowerCase() || '';
		const otherDomains = domains.filter((d) => d !== targetHost);
		html += `<div class="bg-cyber-card border border-amber-500/20 rounded-xl overflow-hidden mb-4">
			<div class="px-4 py-2.5 border-b border-amber-500/20 bg-amber-500/5 flex items-center justify-between">
				<h4 class="text-xs font-bold text-amber-400 uppercase tracking-wider">Reverse IP — Shared Hosting (${otherDomains.length} domain${otherDomains.length > 1 ? 's' : ''})</h4>
				${data.ipAddresses?.[0] ? `<code class="text-[10px] font-mono text-gray-500">${escapeHtml(data.ipAddresses[0])}</code>` : ''}
			</div>
			<div class="max-h-64 overflow-y-auto divide-y divide-amber-500/10">`;
		for (const domain of otherDomains) {
			html += `<div class="flex items-center justify-between px-4 py-1.5 hover:bg-cyber-elevated/30 transition-colors">
				<div class="flex items-center gap-2 min-w-0">
					<span class="w-1.5 h-1.5 rounded-full bg-gray-600 flex-shrink-0"></span>
					<code class="text-xs font-mono text-white whitespace-nowrap">${escapeHtml(domain)}</code>
				</div>
				<a href="https://${escapeHtml(domain)}" target="_blank" rel="noopener" class="text-[10px] text-gray-600 hover:text-cyber-accent transition-colors flex-shrink-0 ml-2">
					<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
				</a>
			</div>`;
		}
		html += `</div></div>`;
	}

	html += `</div>`;
	resultsDiv.innerHTML = html;
}


// =============================================
// FEATURE: Full Reconnaissance
// =============================================
async function runFullRecon() {
	const urlInput = document.getElementById('url');
	const url = normalizeUrl(urlInput.value);
	if (!url) {
		showAlert('Please enter a target URL first.', 'Missing URL', 'warning');
		return;
	}
	if (url !== urlInput.value) urlInput.value = url;

	const resultsDiv = document.getElementById('results');
	resultsDiv.innerHTML = `<div class="flex items-center justify-center h-full py-16">
		${cyberLoader({ size: 'lg', color: 'text-cyber-accent', text: 'Running Full Reconnaissance...', subtext: 'Technologies, DNS, WHOIS, SSL, subdomains, probes... (max ~30s)' })}
	</div>`;

	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 30000);
		const resp = await fetch(`/api/recon?url=${encodeURIComponent(url)}`, { signal: controller.signal });
		clearTimeout(timeout);
		const data = await resp.json();
		if (!resp.ok) throw new Error(data.message || data.error || `HTTP ${resp.status}`);
		displayFullReconResults(data);
	} catch (e) {
		const msg =
			e.name === 'AbortError' ? 'Request timed out after 30 seconds. The target site may be too slow or blocking requests.' : e.message;
		resultsDiv.innerHTML = `<div class="text-center py-10 bg-cyber-card border border-white/[0.08] rounded-2xl p-6 shadow-none"><p class="text-cyber-danger font-bold">Full Reconnaissance Failed</p><p class="text-slate-400 text-sm mt-2">${escapeHtml(msg)}</p><button onclick="runFullRecon()" class="mt-4 px-4 py-2 bg-cyber-accent hover:bg-cyber-accent-hover text-white rounded-xl border border-white/10 transition-all text-xs font-semibold shadow-none">Retry</button></div>`;
	}
}

function displayFullReconResults(data) {
	lastFullReconData = data;
	const resultsDiv = document.getElementById('results');
	// Inline style colors for category badges (html2canvas compatible)
	const catColors = {
		CMS: { bg: 'rgba(240,86,39,0.15)', color: '#f05627', border: 'rgba(240,86,39,0.3)' },
		'CMS/E-commerce': { bg: 'rgba(240,86,39,0.15)', color: '#f05627', border: 'rgba(240,86,39,0.3)' },
		Framework: { bg: 'rgba(240,86,39,0.15)', color: '#f05627', border: 'rgba(240,86,39,0.3)' },
		Frontend: { bg: 'rgba(240,86,39,0.15)', color: '#f05627', border: 'rgba(240,86,39,0.3)' },
		Language: { bg: 'rgba(234,179,8,0.15)', color: '#facc15', border: 'rgba(234,179,8,0.3)' },
		'Web Server': { bg: 'rgba(249,115,22,0.15)', color: '#fb923c', border: 'rgba(249,115,22,0.3)' },
		'CDN/WAF': { bg: 'rgba(240,86,39,0.15)', color: '#f05627', border: 'rgba(240,86,39,0.3)' },
		CDN: { bg: 'rgba(240,86,39,0.15)', color: '#f05627', border: 'rgba(240,86,39,0.3)' },
		Cache: { bg: 'rgba(240,86,39,0.15)', color: '#f05627', border: 'rgba(240,86,39,0.3)' },
		Platform: { bg: 'rgba(240,86,39,0.15)', color: '#f05627', border: 'rgba(240,86,39,0.3)' },
		Analytics: { bg: 'rgba(34,197,94,0.15)', color: '#4ade80', border: 'rgba(34,197,94,0.3)' },
		Security: { bg: 'rgba(239,68,68,0.15)', color: '#f87171', border: 'rgba(239,68,68,0.3)' },
		Generator: { bg: 'rgba(107,114,128,0.15)', color: '#9ca3af', border: 'rgba(107,114,128,0.3)' },
		'Website Builder': { bg: 'rgba(240,86,39,0.15)', color: '#f05627', border: 'rgba(240,86,39,0.3)' },
		'JS Library': { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
		'E-commerce': { bg: 'rgba(240,86,39,0.15)', color: '#f05627', border: 'rgba(240,86,39,0.3)' },
		SEO: { bg: 'rgba(132,204,22,0.15)', color: '#a3e635', border: 'rgba(132,204,22,0.3)' },
		Font: { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8', border: 'rgba(100,116,139,0.3)' },
		Chat: { bg: 'rgba(240,86,39,0.15)', color: '#f05627', border: 'rgba(240,86,39,0.3)' },
		Marketing: { bg: 'rgba(240,86,39,0.15)', color: '#f05627', border: 'rgba(240,86,39,0.3)' },
	};
	const defaultCatColor = { bg: 'rgba(107,114,128,0.15)', color: '#9ca3af', border: 'rgba(107,114,128,0.3)' };

	// CMS logos: use real logos from Simple Icons CDN
	const cmsLogos = {
		WordPress: '<img src="https://cdn.simpleicons.org/wordpress/21759b" alt="WordPress" class="w-8 h-8">',
		Drupal: '<img src="https://cdn.simpleicons.org/drupal/0678be" alt="Drupal" class="w-8 h-8">',
		Joomla: '<img src="https://cdn.simpleicons.org/joomla/5091cd" alt="Joomla" class="w-8 h-8">',
		Shopify: '<img src="https://cdn.simpleicons.org/shopify/7ab55c" alt="Shopify" class="w-8 h-8">',
		Magento: '<img src="https://cdn.simpleicons.org/magento/ee672f" alt="Magento" class="w-8 h-8">',
		PrestaShop: '<img src="https://cdn.simpleicons.org/prestashop/df0067" alt="PrestaShop" class="w-8 h-8">',
		Ghost: '<img src="https://cdn.simpleicons.org/ghost/ffffff" alt="Ghost" class="w-8 h-8">',
		TYPO3: '<img src="https://cdn.simpleicons.org/typo3/ff8700" alt="TYPO3" class="w-8 h-8">',
		Wix: '<img src="https://cdn.simpleicons.org/wix/0c6efc" alt="Wix" class="w-8 h-8">',
		Squarespace: '<img src="https://cdn.simpleicons.org/squarespace/ffffff" alt="Squarespace" class="w-8 h-8">',
		Webflow: '<img src="https://cdn.simpleicons.org/webflow/4353ff" alt="Webflow" class="w-8 h-8">',
		Hugo: '<img src="https://cdn.simpleicons.org/hugo/ff4088" alt="Hugo" class="w-8 h-8">',
		'Next.js': '<img src="https://cdn.simpleicons.org/nextdotjs/ffffff" alt="Next.js" class="w-8 h-8">',
		Gatsby: '<img src="https://cdn.simpleicons.org/gatsby/663399" alt="Gatsby" class="w-8 h-8">',
		Nuxt: '<img src="https://cdn.simpleicons.org/nuxtdotjs/00dc82" alt="Nuxt" class="w-8 h-8">',
		Laravel: '<img src="https://cdn.simpleicons.org/laravel/ff2d20" alt="Laravel" class="w-8 h-8">',
		Django: '<img src="https://cdn.simpleicons.org/django/092e20" alt="Django" class="w-8 h-8">',
		'Craft CMS': '<img src="https://cdn.simpleicons.org/craftcms/e5422b" alt="Craft CMS" class="w-8 h-8">',
		Contentful: '<img src="https://cdn.simpleicons.org/contentful/2478cc" alt="Contentful" class="w-8 h-8">',
		Strapi: '<img src="https://cdn.simpleicons.org/strapi/4945ff" alt="Strapi" class="w-8 h-8">',
	};

	let html = `<div class="full-recon-container p-4">
		<!-- Header -->
		<div class="flex items-center justify-between mb-4 p-4 bg-cyber-card border border-white/[0.08] rounded-2xl shadow-none">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 rounded-xl bg-cyber-elevated border border-white/[0.08] flex items-center justify-center text-cyber-accent">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
					</svg>
				</div>
				<div>
					<h3 class="text-base font-bold text-white tracking-tight">Full Reconnaissance</h3>
					<p class="text-xs text-slate-400"><span class="font-mono text-white">${escapeHtml(data.hostname)}</span> &mdash; ${data.responseTime}ms</p>
				</div>
			</div>
			<div class="flex items-center gap-2">
				<button onclick="exportReconJSON('recon')" class="text-xs bg-[#181923] hover:bg-[#20212d] border border-white/[0.08] hover:border-white/[0.18] text-slate-300 hover:text-white px-3.5 py-1.5 rounded-[10px] transition-all font-semibold shadow-none" title="Export JSON">JSON</button>
				<button onclick="exportReconHTML('recon')" class="text-xs bg-[#181923] hover:bg-[#20212d] border border-white/[0.08] hover:border-white/[0.18] text-slate-300 hover:text-white px-3.5 py-1.5 rounded-[10px] transition-all font-semibold shadow-none" title="Export HTML">HTML</button>
				<button onclick="exportReconScreenshot(event)" class="text-xs bg-[#181923] hover:bg-[#20212d] border border-white/[0.08] hover:border-white/[0.18] text-slate-300 hover:text-white px-2.5 py-1.5 rounded-[10px] transition-all shadow-none" title="Screenshot">
					<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
				</button>
			</div>
		</div>

		<!-- Section 1: Page Info -->
		<div class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
			<div class="px-4 py-3 border-b border-white/[0.08] bg-cyber-elevated/40 flex items-center justify-between">
				<div class="flex items-center gap-2 min-w-0">
					<h4 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-0 leading-none">Page Information</h4>
					${reconTip('Basic information extracted from the HTML page: title tag, meta description, HTTP status code, language and canonical URL.')}
				</div>
			</div>
			<div class="divide-y divide-white/[0.05]">
				<div class="px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-2 hover:bg-white/[0.015] transition-colors">
					<span class="text-xs text-slate-400 font-semibold uppercase tracking-wider min-w-[130px]">Title</span>
					<span class="text-sm text-white font-medium break-words text-left md:text-right flex-1">${escapeHtml(data.pageInfo?.title || 'N/A')}</span>
				</div>
				<div class="px-4 py-3 flex items-center justify-between gap-2 hover:bg-white/[0.015] transition-colors">
					<span class="text-xs text-slate-400 font-semibold uppercase tracking-wider">Status</span>
					<span class="text-sm text-white font-mono font-semibold">${data.pageInfo?.statusCode || 'N/A'}</span>
				</div>
				<div class="px-4 py-3 flex flex-col md:flex-row md:items-start justify-between gap-2 hover:bg-white/[0.015] transition-colors">
					<span class="text-xs text-slate-400 font-semibold uppercase tracking-wider min-w-[130px] pt-0.5">Description</span>
					<span class="text-sm text-slate-300 leading-relaxed text-left md:text-right flex-1 break-words">${escapeHtml(data.pageInfo?.description || 'N/A')}</span>
				</div>
				${data.pageMeta?.language ? `
				<div class="px-4 py-3 flex items-center justify-between gap-2 hover:bg-white/[0.015] transition-colors">
					<span class="text-xs text-slate-400 font-semibold uppercase tracking-wider">Language</span>
					<span class="text-sm text-white font-mono font-medium">${escapeHtml(data.pageMeta.language)}</span>
				</div>` : ''}
				${data.pageMeta?.canonical ? `
				<div class="px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-2 hover:bg-white/[0.015] transition-colors">
					<span class="text-xs text-slate-400 font-semibold uppercase tracking-wider min-w-[130px]">Canonical</span>
					<span class="text-xs text-slate-300 break-all font-mono font-medium text-left md:text-right flex-1">${escapeHtml(data.pageMeta.canonical)}</span>
				</div>` : ''}
			</div>
		</div>`;

	// === Section 2: Domain WHOIS (RDAP) ===
	console.log('[WAF-Checker] domainWhois data:', data.domainWhois);
	try {
		if (data.domainWhois) {
			const dw = data.domainWhois;
			const crDate = dw.creationDate ? new Date(dw.creationDate) : null;
			const expDate = dw.expirationDate ? new Date(dw.expirationDate) : null;
			const chgDate = dw.lastChanged ? new Date(dw.lastChanged) : null;
			const dwDaysLeft = expDate ? Math.ceil((expDate.getTime() - Date.now()) / 86400000) : null;
			const expColor =
				dwDaysLeft === null ? 'text-slate-500' : dwDaysLeft > 90 ? 'text-emerald-400' : dwDaysLeft > 30 ? 'text-amber-400' : 'text-red-400';
			const domAge = crDate ? Math.floor((Date.now() - crDate.getTime()) / (86400000 * 365.25)) : null;
			const fDate = (d) => (d ? d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A');

			// Helper to render a contact card
			const renderContact = (label, contact, iconSvg) => {
				if (!contact) return '';
				const fields = [];
				if (contact.name)
					fields.push({
						icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
						val: contact.name,
						color: '#ffffff',
						bold: true,
						size: '13px',
					});
				if (contact.organization || contact.org)
					fields.push({
						icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
						val: contact.organization || contact.org,
						color: '#cbd5e1',
						bold: false,
						size: '13px',
					});
				if (contact.email)
					fields.push({
						icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
						val: contact.email,
						color: '#f05627',
						bold: false,
						size: '13px',
						mono: true,
					});
				if (contact.phone)
					fields.push({
						icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
						val: contact.phone,
						color: '#94a3b8',
						bold: false,
						size: '13px',
						mono: true,
					});
				const loc = [contact.address, contact.country && !contact.address?.includes(contact.country) ? contact.country : null]
					.filter(Boolean)
					.join(', ');
				if (loc)
					fields.push({
						icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z',
						val: loc,
						color: '#64748b',
						bold: false,
						size: '12px',
					});
				if (fields.length === 0) return '';
				const rowsHtml = fields
					.map(
						(f) =>
							'<div style="display:flex;align-items:center;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.05)">' +
							'<span style="display:inline-flex;width:20px;align-items:center;margin-right:8px;color:#94a3b8">' +
							'<svg style="width:14px;height:14px" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="' +
							f.icon +
							'"/></svg></span>' +
							'<span style="font-size:' +
							f.size +
							';color:' +
							f.color +
							(f.bold ? ';font-weight:700' : '') +
							(f.mono ? ';font-family:monospace' : '') +
							';word-break:break-all">' +
							escapeHtml(f.val) +
							'</span></div>',
					)
					.join('');
				return (
					'<div class="bg-cyber-elevated/25 border border-white/[0.06] rounded-xl p-3.5">' +
					'<div class="flex items-center gap-2 mb-2">' +
					iconSvg +
					'<span class="text-xs text-slate-400 uppercase font-bold tracking-wider">' +
					escapeHtml(label) +
					'</span></div>' +
					rowsHtml +
					'</div>'
				);
			};

			const contactIcons = {
				registrant:
					'<svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>',
				admin:
					'<svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>',
				tech: '<svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>',
				abuse:
					'<svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>',
			};

			html += `<div class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
			<div class="px-4 py-3 border-b border-white/[0.08] bg-cyber-elevated/40 flex items-center justify-between">
				<div class="flex items-center gap-2 min-w-0">
					<h4 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-0 leading-none">Domain WHOIS — ${escapeHtml(dw.domainName || data.hostname)}</h4>
					${reconTip('Domain registration data via RDAP: registrar, owner, contacts, dates, status, and DNSSEC.')}
				</div>
			</div>

			<!-- Registration Info -->
			<div class="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 divide-x-0 md:divide-x divide-white/[0.05] border-b border-white/[0.06]">
				${dw.registrar ? `<div class="p-4 col-span-2 hover:bg-white/[0.015] transition-colors"><span class="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">Registrar</span><span class="text-sm text-white font-medium">${escapeHtml(dw.registrar)}</span></div>` : ''}
				<div class="p-4 hover:bg-white/[0.015] transition-colors">
					<span class="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">Created</span>
					<span class="text-sm text-white font-mono font-medium">${fDate(crDate)}</span>
					${domAge !== null ? `<span class="text-xs text-slate-400 ml-1">(${domAge}y)</span>` : ''}
				</div>
				<div class="p-4 hover:bg-white/[0.015] transition-colors">
					<span class="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">Expires</span>
					<span class="text-sm font-mono font-medium ${expColor}">${fDate(expDate)}</span>
					${dwDaysLeft !== null ? `<span class="text-xs ${expColor} ml-1">(${dwDaysLeft > 0 ? dwDaysLeft + 'd' : 'EXPIRED'})</span>` : ''}
				</div>
				${chgDate ? `<div class="p-4 hover:bg-white/[0.015] transition-colors"><span class="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">Last Updated</span><span class="text-sm text-white font-mono font-medium">${fDate(chgDate)}</span></div>` : ''}
				<div class="p-4 hover:bg-white/[0.015] transition-colors">
					<span class="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">DNSSEC</span>
					<span class="text-sm font-bold ${dw.dnssec ? 'text-emerald-400' : 'text-slate-400'}">${dw.dnssec ? 'Signed' : 'Unsigned'}</span>
				</div>
			</div>`;

			// Contacts section
			const contactCards = [];
			contactCards.push(renderContact('Registrant (Owner)', dw.registrant, contactIcons.registrant));
			contactCards.push(renderContact('Administrative', dw.adminContact, contactIcons.admin));
			contactCards.push(renderContact('Technical', dw.techContact, contactIcons.tech));
			contactCards.push(renderContact('Abuse', dw.abuseContact, contactIcons.abuse));
			const validContacts = contactCards.filter((c) => c);
			if (validContacts.length > 0) {
				html += `<div class="p-4 border-b border-white/[0.06]">
				<h5 class="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Contacts</h5>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
					${validContacts.join('')}
				</div>
			</div>`;
			}

			if (dw.status && dw.status.length > 0) {
				html += `<div class="px-4 py-3 bg-cyber-elevated/20">
				<span class="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-2">Domain Status</span>
				<div class="flex flex-wrap gap-2">
					${dw.status
						.map((s) => {
							const isOk = s.includes('ok') || s.includes('active');
							const isLock = s.includes('Lock') || s.includes('Prohibited');
							const color = isOk
								? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
								: isLock
									? 'text-cyber-accent bg-cyber-accent/10 border-cyber-accent/30'
									: 'text-slate-400 bg-cyber-elevated border-white/[0.08]';
							return `<span class="text-xs px-2.5 py-1 rounded-lg border ${color} font-mono font-medium">${escapeHtml(s)}</span>`;
						})
						.join('')}
				</div>
			</div>`;
			}
			html += `</div>`;
		} else {
			// RDAP data unavailable — show fallback
			html += `<div class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
			<div class="px-4 py-3 border-b border-white/[0.08] bg-cyber-elevated/40 flex items-center justify-between">
				<div class="flex items-center gap-2 min-w-0">
					<h4 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-0 leading-none">Domain WHOIS</h4>
					${reconTip('Domain registration data via RDAP: registrar, owner, contacts, dates, status, and DNSSEC.')}
				</div>
			</div>
			<div class="p-4 text-center text-slate-400 text-sm">RDAP data unavailable for this domain (timeout or unsupported TLD)</div>
		</div>`;
		}
	} catch (whoisErr) {
		console.error('[WAF-Checker] Domain WHOIS rendering error:', whoisErr);
		html += `<div class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
			<div class="px-4 py-3 border-b border-white/[0.08] bg-cyber-elevated/40 flex items-center gap-2">
				<h4 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-0 leading-none">Domain WHOIS</h4>
				${reconTip('Domain registration data via RDAP: registrar, owner, contacts, dates, status, and DNSSEC.')}
			</div>
			<div class="p-4 text-center text-slate-400 text-sm">Error rendering WHOIS data</div>
		</div>`;
	}

	// === Section 3: SSL / TLS Security ===
	const ssl = data.ssl || {};
	const cert = ssl.certificate;
	const sslChecks = ssl.checks || [];
	const sslGrade = ssl.grade || 'N/A';
	const sslScore = ssl.score || 0;

	const statusBadge = (s) => {
		if (s === 'ok')
			return '<span class="text-[11px] px-2.5 py-0.5 rounded-md font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">OK</span>';
		if (s === 'warning')
			return '<span class="text-[11px] px-2.5 py-0.5 rounded-md font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 whitespace-nowrap">WARNING</span>';
		if (s === 'fail')
			return '<span class="text-[11px] px-2.5 py-0.5 rounded-md font-bold bg-red-500/15 text-red-400 border border-red-500/30 whitespace-nowrap">FAIL</span>';
		return '<span class="text-[11px] px-2.5 py-0.5 rounded-md font-bold bg-cyber-accent/15 text-cyber-accent border border-cyber-accent/30 whitespace-nowrap">INFO</span>';
	};

	const gradeColor =
		sslScore >= 90
			? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
			: sslScore >= 70
				? 'text-cyber-accent border-cyber-accent/30 bg-cyber-accent/10'
				: sslScore >= 50
					? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
					: 'text-red-400 border-red-500/30 bg-red-500/10';

	html += `<div class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
		<div class="px-4 py-3 border-b border-white/[0.08] bg-cyber-elevated/40 flex items-center justify-between">
			<div class="flex items-center gap-2 min-w-0">
				<h4 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-0 leading-none">SSL / TLS Security</h4>
				${reconTip('Comprehensive SSL/TLS security analysis: HTTPS enforcement, HTTP→HTTPS redirect, HSTS policy, certificate details, mixed content detection, and overall security score.')}
			</div>
			<div class="flex items-center gap-2.5">
				<span class="text-xs text-slate-400 font-mono">${sslScore}/100</span>
				<span class="text-base font-bold px-3 py-0.5 rounded-[10px] border ${gradeColor}">${sslGrade}</span>
			</div>
		</div>`;

	if (sslChecks.length > 0) {
		html += `<div class="divide-y divide-white/[0.05]">`;
		for (const check of sslChecks) {
			html += `<div class="flex items-center justify-between px-4 py-3 hover:bg-white/[0.015] transition-colors">
				<div class="flex items-center gap-3">
					${statusBadge(check.status)}
					<span class="text-sm text-white font-medium">${escapeHtml(check.test)}</span>
				</div>
				<span class="text-xs text-slate-300 text-right max-w-[60%]">${escapeHtml(check.detail)}</span>
			</div>`;
		}
		html += `</div>`;
	}

	if (ssl.tlsInfo?.protocols && ssl.tlsInfo.protocols.length > 0) {
		html += `<div class="border-t border-white/[0.08]">
			<div class="px-4 py-3 bg-cyber-elevated/40 border-b border-white/[0.08] flex items-center gap-2">
				<h5 class="text-xs font-bold text-slate-300 uppercase tracking-wider mb-0 leading-none">Protocols</h5>
				${reconTip('TLS protocol version support. TLS 1.3 is the latest and most secure. TLS 1.0/1.1 are deprecated and should be disabled. HTTP/3 runs over QUIC and requires TLS 1.3.')}
			</div>
			<div class="divide-y divide-white/[0.05]">`;
		for (const proto of ssl.tlsInfo.protocols) {
			const badge =
				proto.supported === true
					? '<span class="text-[11px] px-2.5 py-0.5 rounded-md font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">SUPPORTED</span>'
					: proto.supported === false
						? '<span class="text-[11px] px-2.5 py-0.5 rounded-md font-bold bg-red-500/15 text-red-400 border border-red-500/30 whitespace-nowrap">DISABLED</span>'
						: '<span class="text-[11px] px-2.5 py-0.5 rounded-md font-bold bg-slate-500/15 text-slate-400 border border-white/[0.08] whitespace-nowrap">UNKNOWN</span>';
			const nameColor = proto.name === 'TLS 1.0' || proto.name === 'TLS 1.1' ? 'text-slate-500' : 'text-white';
			html += `<div class="flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.015] transition-colors">
				<div class="flex items-center gap-3">
					${badge}
					<span class="text-sm font-semibold ${nameColor}">${escapeHtml(proto.name)}</span>
					${proto.name === 'TLS 1.0' || proto.name === 'TLS 1.1' ? '<span class="text-[9px] px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 font-bold">DEPRECATED</span>' : ''}
				</div>
				<span class="text-xs text-slate-300 text-right">${escapeHtml(proto.note)}</span>
			</div>`;
		}
		if (ssl.tlsInfo.http3) {
			html += `<div class="flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.015] transition-colors">
				<div class="flex items-center gap-3">
					<span class="text-[11px] px-2.5 py-0.5 rounded-md font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">SUPPORTED</span>
					<span class="text-sm font-semibold text-white">HTTP/3 (QUIC)</span>
				</div>
				<span class="text-xs text-slate-300">Advertised via Alt-Svc header</span>
			</div>`;
		}
		if (ssl.tlsInfo.http2 && !ssl.tlsInfo.http3) {
			html += `<div class="flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.015] transition-colors">
				<div class="flex items-center gap-3">
					<span class="text-[11px] px-2.5 py-0.5 rounded-md font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">SUPPORTED</span>
					<span class="text-sm font-semibold text-white">HTTP/2</span>
				</div>
				<span class="text-xs text-slate-300">Detected via ALPN</span>
			</div>`;
		}
		html += `</div></div>`;
	}

	if (cert) {
		const issuerCN = cert.issuer ? (cert.issuer.match(/CN=([^,]+)/)?.[1] || '').trim() : '';
		const issuerOrg = cert.issuer ? (cert.issuer.match(/O=([^,]+)/)?.[1] || '').trim() : '';
		const notAfter = cert.notAfter ? new Date(cert.notAfter) : null;
		const notBefore = cert.notBefore ? new Date(cert.notBefore) : null;
		const certDaysLeft = notAfter ? Math.ceil((notAfter.getTime() - Date.now()) / 86400000) : null;
		const validityColor =
			certDaysLeft === null
				? 'text-slate-500'
				: certDaysLeft > 30
					? 'text-emerald-400'
					: certDaysLeft > 0
						? 'text-amber-400'
						: 'text-red-400';
		const totalDays = notBefore && notAfter ? Math.ceil((notAfter.getTime() - notBefore.getTime()) / 86400000) : null;

		html += `<div class="border-t border-white/[0.08]">
			<div class="px-4 py-3 bg-cyber-elevated/40 border-b border-white/[0.08] flex items-center gap-2"><h5 class="text-xs font-bold text-slate-300 uppercase tracking-wider mb-0 leading-none">Certificate</h5>${reconTip('SSL/TLS digital certificate issued for domain identity validation and HTTPS encryption.')}</div>
			<div class="divide-y divide-white/[0.05]">
				<div class="px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-1 hover:bg-white/[0.015] transition-colors">
					<span class="text-xs text-slate-400 font-semibold uppercase tracking-wider min-w-[130px]">Subject (CN)</span>
					<span class="text-sm text-white font-mono font-semibold break-all text-left md:text-right">${escapeHtml(cert.subject || data.hostname)}</span>
				</div>
				<div class="px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-1 hover:bg-white/[0.015] transition-colors">
					<span class="text-xs text-slate-400 font-semibold uppercase tracking-wider min-w-[130px]">Issuer</span>
					<div class="text-left md:text-right">
						<span class="text-sm text-white font-semibold">${escapeHtml(issuerOrg || issuerCN || 'Unknown')}</span>
						${issuerCN && issuerOrg ? `<span class="text-xs text-slate-400 font-mono ml-2">CN=${escapeHtml(issuerCN)}</span>` : ''}
					</div>
				</div>
				<div class="px-4 py-3 flex items-center justify-between gap-2 hover:bg-white/[0.015] transition-colors">
					<span class="text-xs text-slate-400 font-semibold uppercase tracking-wider">Valid From</span>
					<span class="text-sm text-white font-mono font-medium">${notBefore ? notBefore.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}</span>
				</div>
				<div class="px-4 py-3 flex items-center justify-between gap-2 hover:bg-white/[0.015] transition-colors">
					<span class="text-xs text-slate-400 font-semibold uppercase tracking-wider">Valid Until</span>
					<div class="text-right">
						<span class="text-sm font-mono font-medium ${validityColor}">${notAfter ? notAfter.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}</span>
						${certDaysLeft !== null ? `<span class="text-xs ${validityColor} ml-1.5">(${certDaysLeft > 0 ? certDaysLeft + 'd left' : 'EXPIRED'})</span>` : ''}
					</div>
				</div>
				${ssl.certAlgorithm ? `
				<div class="px-4 py-3 flex items-center justify-between gap-2 hover:bg-white/[0.015] transition-colors">
					<span class="text-xs text-slate-400 font-semibold uppercase tracking-wider">Key Algorithm</span>
					<span class="text-sm font-semibold ${ssl.certAlgorithm === 'ECDSA' ? 'text-emerald-400' : 'text-cyber-accent'}">${ssl.certAlgorithm}</span>
				</div>` : ''}
				${totalDays ? `
				<div class="px-4 py-3 flex items-center justify-between gap-2 hover:bg-white/[0.015] transition-colors">
					<span class="text-xs text-slate-400 font-semibold uppercase tracking-wider">Duration</span>
					<span class="text-sm text-white font-mono font-medium">${totalDays} days</span>
				</div>` : ''}
			</div>`;
		if (cert.serialNumber)
			html += `<div class="px-4 py-2.5 border-t border-white/[0.05] flex items-center justify-between hover:bg-white/[0.015] transition-colors"><span class="text-xs text-slate-400 font-semibold uppercase tracking-wider">Serial Number</span><span class="text-xs text-slate-300 font-mono break-all ml-2 font-medium">${escapeHtml(cert.serialNumber)}</span></div>`;
		if (cert.domains && cert.domains.length > 0)
			html += `<div class="px-4 py-3 border-t border-white/[0.05]"><span class="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-2">SAN DNS Names (${cert.domains.length})</span><div class="flex flex-wrap gap-2">${cert.domains.map((d) => `<span class="text-xs font-mono text-emerald-400 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg font-medium">${escapeHtml(d)}</span>`).join('')}</div></div>`;
		html += `</div>`;
	}

	if (ssl.mixedContent && ssl.mixedContent.length > 0) {
		html += `<div class="border-t border-white/[0.08]"><div class="px-4 py-2.5 bg-red-500/10 border-b border-red-500/20"><h5 class="text-xs font-bold text-red-400 uppercase tracking-wider mb-0">Mixed Content (${ssl.mixedContent.length})</h5></div><div class="p-4 space-y-1.5">${ssl.mixedContent.map((url) => `<span class="block text-xs font-mono text-red-400/90 break-all">${escapeHtml(url)}</span>`).join('')}</div></div>`;
	}

	html += `<div class="border-t border-white/[0.08] bg-cyber-elevated/20"><div class="px-4 py-3 flex flex-wrap gap-4">
		${ssl.serverHeader ? `<div class="flex items-center gap-2"><span class="text-xs text-slate-400 uppercase tracking-wider font-semibold">Server:</span><span class="text-xs font-mono text-white font-medium">${escapeHtml(ssl.serverHeader)}</span></div>` : ''}
		${ssl.tlsInfo?.alpn ? `<div class="flex items-center gap-2"><span class="text-xs text-slate-400 uppercase tracking-wider font-semibold">Alt-Svc:</span><span class="text-xs font-mono text-slate-300 break-all font-medium">${escapeHtml(ssl.tlsInfo.alpn)}</span></div>` : ''}
	</div></div></div>`;

	// === Section 4: DNS (IP Addresses + Nameservers) ===
	html += `<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
		<div class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden shadow-none">
			<div class="px-4 py-3 border-b border-white/[0.08] bg-cyber-elevated/40 flex items-center justify-between">
				<div class="flex items-center gap-2 min-w-0">
					<h4 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-0 leading-none">IP Addresses</h4>
					${reconTip('IPv4/IPv6 addresses resolved via DNS A/AAAA records.')}
				</div>
			</div>
			<div class="divide-y divide-white/[0.05]">
				${(data.dns?.ipAddresses || []).map((ip) => `<div class="px-4 py-3 text-sm font-mono text-white font-medium hover:bg-white/[0.015] transition-colors">${escapeHtml(ip)}</div>`).join('') || '<div class="px-4 py-3 text-sm text-slate-500">None</div>'}
				${(data.dns?.ipv6Addresses || []).length > 0 ? data.dns.ipv6Addresses.map((ip) => `<div class="px-4 py-2.5 text-xs font-mono text-slate-400 break-all font-medium hover:bg-white/[0.015] transition-colors">${escapeHtml(ip)}</div>`).join('') : ''}
			</div>
		</div>
		<div class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden shadow-none">
			<div class="px-4 py-3 border-b border-white/[0.08] bg-cyber-elevated/40 flex items-center justify-between">
				<div class="flex items-center gap-2 min-w-0">
					<h4 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-0 leading-none">Nameservers</h4>
					${reconTip('DNS nameservers (NS records) responsible for the domain.')}
				</div>
			</div>
			<div class="divide-y divide-white/[0.05]">
				${(data.dns?.nameservers || []).map((ns) => `<div class="px-4 py-3 text-sm font-mono text-white font-medium hover:bg-white/[0.015] transition-colors">${escapeHtml(ns)}</div>`).join('') || '<div class="px-4 py-3 text-sm text-slate-500">None</div>'}
			</div>
		</div>
	</div>`;

	// === Section 5: Infrastructure ===
	if (data.infrastructure && data.infrastructure.length > 0) {
		html += `<div class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
			<div class="px-4 py-3 border-b border-white/[0.08] bg-cyber-elevated/40 flex items-center justify-between">
				<div class="flex items-center gap-2 min-w-0">
					<h4 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-0 leading-none">Infrastructure</h4>
					${reconTip('Hosting infrastructure detected from DNS records: CDN providers, email services, and DNS providers.')}
				</div>
			</div>
			<div class="divide-y divide-white/[0.05]">`;
		for (const infra of data.infrastructure) {
			html += `<div class="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.015] transition-colors">
				<span class="px-2.5 py-0.5 text-[11px] font-bold uppercase rounded-lg bg-cyber-accent/10 text-cyber-accent border border-cyber-accent/30">${escapeHtml(infra.type)}</span>
				<span class="text-sm font-semibold text-white">${escapeHtml(infra.provider)}</span>
			</div>`;
		}
		html += `</div></div>`;
	}

	// === Section 6: IP WHOIS ===
	if (data.whois) {
		const w = data.whois;
		html += `<div class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
			<div class="px-4 py-3 border-b border-white/[0.08] bg-cyber-elevated/40 flex items-center justify-between">
				<div class="flex items-center gap-2 min-w-0">
					<h4 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-0 leading-none">IP WHOIS — ${escapeHtml(w.ip || '')}</h4>
					${reconTip('IP geolocation and ownership: ISP, organization, ASN, and location.')}
				</div>
			</div>
			<div class="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 divide-x-0 md:divide-x divide-white/[0.05] border-b border-white/[0.06]">
				<div class="p-4 hover:bg-white/[0.015] transition-colors"><span class="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">ISP</span><span class="text-sm text-white font-medium">${escapeHtml(w.isp || 'N/A')}</span></div>
				<div class="p-4 hover:bg-white/[0.015] transition-colors"><span class="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">Org</span><span class="text-sm text-white font-medium">${escapeHtml(w.org || 'N/A')}</span></div>
				<div class="p-4 hover:bg-white/[0.015] transition-colors"><span class="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">ASN</span><span class="text-sm text-white font-mono font-medium">${escapeHtml(w.asn || 'N/A')}</span></div>
				<div class="p-4 hover:bg-white/[0.015] transition-colors"><span class="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">Location</span><span class="text-sm text-white font-medium">${escapeHtml(w.city || '')}${w.city && w.country ? ', ' : ''}${escapeHtml(w.country || 'N/A')}</span></div>
			</div>
			${data.reverseDns ? `<div class="px-4 py-3 flex items-center justify-between gap-2 hover:bg-white/[0.015] transition-colors"><div class="flex items-center gap-2"><span class="text-xs text-slate-400 font-semibold uppercase tracking-wider">Reverse DNS (PTR)</span>${reconTip('PTR record maps IP back to hostname.')}</div><span class="text-sm font-mono text-cyber-accent break-all font-medium">${escapeHtml(data.reverseDns)}</span></div>` : ''}
		</div>`;
	}

	// === Section 7: Technologies ===
	if (data.technologies && data.technologies.length > 0) {
		html += `<div class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
			<div class="px-4 py-3 border-b border-white/[0.08] bg-cyber-elevated/40 flex items-center justify-between">
				<div class="flex items-center gap-2 min-w-0">
					<h4 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-0 leading-none">Detected Technologies (${data.technologies.length})</h4>
					${reconTip('Technologies identified from HTTP headers, HTML patterns, cookies, and CDN/WAF signatures.')}
				</div>
			</div>
			<div class="divide-y divide-white/[0.05]">`;
		for (const tech of data.technologies) {
			const cc = catColors[tech.category] || defaultCatColor;
			html += `<div class="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.015] transition-colors">
				<span style="padding:2.5px 9px;font-size:11px;font-weight:700;text-transform:uppercase;border-radius:6px;border:1px solid ${cc.border};background:${cc.bg};color:${cc.color};white-space:nowrap">${escapeHtml(tech.category)}</span>
				<span class="text-sm font-semibold text-white">${escapeHtml(tech.name)}</span>
				<span class="text-xs text-slate-300 ml-auto hidden md:block font-mono">${escapeHtml(tech.evidence)}</span>
			</div>`;
		}
		html += `</div></div>`;
	}

	// === Section 8: CMS Details ===
	const cms = data.cmsDetails;
	if (cms && (cms.cmsName || cms.plugins?.length > 0 || cms.themes?.length > 0)) {
		html += `<div class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
			<div class="px-4 py-3 border-b border-white/[0.08] bg-cyber-elevated/40 flex items-center justify-between">
				<div class="flex items-center gap-2 min-w-0">
					<h4 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-0 leading-none">CMS Details</h4>
					${reconTip('CMS detected from HTML patterns, meta generator tag, and resource URLs. Plugins/themes from wp-content paths.')}
				</div>
			</div>
			<div class="divide-y divide-white/[0.05]">`;
		if (cms.cmsName) {
			const logo =
				cmsLogos[cms.cmsName] ||
				`<div class="w-8 h-8 rounded-lg bg-cyber-accent/20 flex items-center justify-center text-cyber-accent font-bold text-sm">${escapeHtml(cms.cmsName.charAt(0))}</div>`;
			html += `<div class="flex items-center gap-4 px-4 py-3.5 hover:bg-white/[0.015] transition-colors">
				<div class="flex-shrink-0">${logo}</div>
				<div><div class="text-base font-bold text-white">${escapeHtml(cms.cmsName)}</div></div>
			</div>`;
		}
		if (data.pageInfo?.generatorFull && data.pageInfo.generatorFull !== data.pageInfo.generator) {
			html += `<div class="px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-1 hover:bg-white/[0.015] transition-colors">
				<span class="text-xs text-slate-400 font-semibold uppercase tracking-wider min-w-[130px]">Page Builder / Generator</span>
				<span class="text-xs text-slate-300 font-mono break-all font-medium text-left md:text-right flex-1">${escapeHtml(data.pageInfo.generatorFull)}</span>
			</div>`;
		}
		if (cms.themes && cms.themes.length > 0) {
			html += `<div>
				<div class="px-4 py-2.5 bg-cyber-elevated/30 border-b border-white/[0.06] text-xs text-slate-400 uppercase font-bold tracking-wider">Themes (${cms.themes.length})</div>
				<div class="divide-y divide-white/[0.05]">`;
			for (const theme of cms.themes) {
				html += `<div class="flex items-center gap-2.5 px-4 py-2.5 hover:bg-white/[0.015] transition-colors">
					<span class="w-2 h-2 rounded-full ${theme.active ? 'bg-cyber-accent' : 'bg-slate-600'}"></span>
					<span class="text-sm text-white font-medium">${escapeHtml(theme.name)}</span>
					${theme.version ? `<span class="text-xs font-mono text-cyber-accent/80 font-medium">${escapeHtml(theme.version)}</span>` : ''}
					${theme.active ? '<span class="text-[10px] px-2 py-0.5 rounded-md bg-cyber-accent/15 text-cyber-accent border border-cyber-accent/30 font-bold ml-auto">ACTIVE</span>' : ''}
					<span class="text-xs text-slate-400 ml-auto font-mono">${escapeHtml(theme.slug)}</span>
				</div>`;
			}
			html += `</div></div>`;
		}
		if (cms.plugins && cms.plugins.length > 0) {
			html += `<div>
				<div class="px-4 py-2.5 bg-cyber-elevated/30 border-b border-white/[0.06] text-xs text-slate-400 uppercase font-bold tracking-wider">Plugins / Extensions (${cms.plugins.length})</div>
				<div class="divide-y divide-white/[0.05]">`;
			for (const plugin of cms.plugins) {
				html += `<div class="flex items-center gap-2.5 px-4 py-2.5 hover:bg-white/[0.015] transition-colors">
					<span class="w-1.5 h-1.5 rounded-full bg-cyber-accent"></span>
					<span class="text-sm text-white font-medium">${escapeHtml(plugin.name)}</span>
					${plugin.version ? `<span class="text-xs font-mono text-cyber-accent/80 font-medium">${escapeHtml(plugin.version)}</span>` : ''}
					<span class="text-xs text-slate-400 ml-auto font-mono">${escapeHtml(plugin.slug)}</span>
				</div>`;
			}
			html += `</div></div>`;
		}
		html += `</div></div>`;
	}

	// === Section 9: JS Libraries ===
	if (data.jsLibraries && data.jsLibraries.length > 0) {
		html += `<div class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
			<div class="px-4 py-3 border-b border-white/[0.08] bg-cyber-elevated/40 flex items-center justify-between">
				<div class="flex items-center gap-2 min-w-0">
					<h4 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-0 leading-none">JavaScript Libraries (${data.jsLibraries.length})</h4>
					${reconTip('Frontend JS libraries detected from script/CSS file names. Versions extracted from filenames.')}
				</div>
			</div>
			<div class="divide-y divide-white/[0.05]">`;
		for (const lib of data.jsLibraries) {
			html += `<div class="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.015] transition-colors">
				<span class="text-sm font-semibold text-white">${escapeHtml(lib.name)}</span>
				${lib.version ? `<span class="text-xs font-mono text-amber-400 font-medium">${escapeHtml(lib.version)}</span>` : ''}
				<span class="text-xs text-slate-300 ml-auto hidden md:block font-mono">${escapeHtml(lib.evidence)}</span>
			</div>`;
		}
		html += `</div></div>`;
	}

	// === Section 10: Security Headers ===
	if (data.securityHeaders) {
		html += `<div class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
			<div class="px-4 py-3 border-b border-white/[0.08] bg-cyber-elevated/40 flex items-center justify-between">
				<div class="flex items-center gap-2 min-w-0">
					<h4 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-0 leading-none">Security Headers</h4>
					${reconTip('HTTP security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.')}
				</div>
				<span class="text-xs font-bold px-2.5 py-1 rounded-lg border font-mono ${parseInt(data.securityHeadersScore) >= 4 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : parseInt(data.securityHeadersScore) >= 2 ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' : 'text-red-400 bg-red-500/10 border-red-500/30'}">${data.securityHeadersScore}</span>
			</div>
			<div class="divide-y divide-white/[0.05]">`;
		for (const [header, value] of Object.entries(data.securityHeaders)) {
			const present = value !== null;
			html += `<div class="flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.015] transition-colors ${present ? 'bg-emerald-500/[0.03]' : ''}">
				<span class="text-sm font-mono font-medium ${present ? 'text-white' : 'text-slate-500'}">${escapeHtml(header)}</span>
				<span class="text-base ${present ? 'text-emerald-400 font-bold' : 'text-slate-600'}">${present ? '✓' : '✗'}</span>
			</div>`;
		}
		html += `</div></div>`;
	}

	// === Section 11: Cookies ===
	if (data.cookies && data.cookies.length > 0) {
		html += `<div class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
			<div class="px-4 py-3 border-b border-white/[0.08] bg-cyber-elevated/40 flex items-center justify-between">
				<div class="flex items-center gap-2 min-w-0">
					<h4 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-0 leading-none">Cookies (${data.cookies.length})</h4>
					${reconTip('Cookies set by the server. Secure = HTTPS only. HttpOnly = no JS access. SameSite = CSRF protection.')}
				</div>
			</div>
			<div class="divide-y divide-white/[0.05]">`;
		for (const cookie of data.cookies) {
			const hasSecure = cookie.flags.includes('Secure');
			const hasHttpOnly = cookie.flags.includes('HttpOnly');
			html += `<div class="flex items-center justify-between px-4 py-3 hover:bg-white/[0.015] transition-colors">
				<span class="text-sm font-mono text-white font-medium">${escapeHtml(cookie.name)}</span>
				<div class="flex gap-2 flex-wrap">
					${cookie.flags
						.map((f) => {
							const color =
								f === 'Secure'
									? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
									: f === 'HttpOnly'
										? 'text-cyber-accent bg-cyber-accent/10 border-cyber-accent/30'
										: 'text-slate-400 bg-cyber-elevated border-white/[0.08]';
							return `<span class="text-[11px] px-2.5 py-0.5 rounded-md border ${color} font-bold">${escapeHtml(f)}</span>`;
						})
						.join('')}
					${!hasSecure ? '<span class="text-[11px] px-2.5 py-0.5 rounded-md border text-red-400 bg-red-500/10 border-red-500/30 font-bold">No Secure</span>' : ''}
					${!hasHttpOnly ? '<span class="text-[11px] px-2.5 py-0.5 rounded-md border text-amber-400 bg-amber-500/10 border-amber-500/30 font-bold">No HttpOnly</span>' : ''}
				</div>
			</div>`;
		}
		html += `</div></div>`;
	}

	// === Section 12: Email Security (SPF / DMARC) ===
	if (data.emailSecurity) {
		const es = data.emailSecurity;
		html += `<div class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
			<div class="px-4 py-3 border-b border-white/[0.08] bg-cyber-elevated/40 flex items-center justify-between">
				<div class="flex items-center gap-2 min-w-0">
					<h4 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-0 leading-none">Email Security</h4>
					${reconTip('SPF defines which mail servers can send emails for this domain. DMARC policy tells receivers how to handle messages that fail SPF/DKIM checks.')}
				</div>
			</div>
			<div class="divide-y divide-white/[0.05]">
				<div class="flex items-center justify-between px-4 py-3 hover:bg-white/[0.015] transition-colors">
					<div class="flex items-center gap-2.5">
						<span class="w-2 h-2 rounded-full ${es.hasSPF ? 'bg-emerald-400' : 'bg-red-400'} flex-shrink-0"></span>
						<span class="text-xs font-bold uppercase tracking-wider ${es.hasSPF ? 'text-emerald-400' : 'text-red-400'}">SPF</span>
					</div>
					<span class="text-xs text-slate-300 font-mono break-all font-medium text-right max-w-[75%]">${es.spf ? escapeHtml(es.spf) : 'Not configured'}</span>
				</div>
				<div class="flex items-center justify-between px-4 py-3 hover:bg-white/[0.015] transition-colors">
					<div class="flex items-center gap-2.5">
						<span class="w-2 h-2 rounded-full ${es.hasDMARC ? 'bg-emerald-400' : 'bg-red-400'} flex-shrink-0"></span>
						<span class="text-xs font-bold uppercase tracking-wider ${es.hasDMARC ? 'text-emerald-400' : 'text-red-400'}">DMARC</span>
					</div>
					<span class="text-xs text-slate-300 font-mono break-all font-medium text-right max-w-[75%]">${es.dmarc ? escapeHtml(es.dmarc) : 'Not configured'}</span>
				</div>
			</div>
		</div>`;
	}

	// === Section 13: Mail Servers (MX) ===
	if (data.mailServers && data.mailServers.length > 0) {
		html += `<div class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
			<div class="px-4 py-3 border-b border-white/[0.08] bg-cyber-elevated/40 flex items-center justify-between">
				<div class="flex items-center gap-2 min-w-0">
					<h4 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-0 leading-none">Mail Servers (MX)</h4>
					${reconTip('Mail Exchange records define which servers handle email for the domain. Priority (P) indicates preference — lower = higher priority.')}
				</div>
			</div>
			<div class="divide-y divide-white/[0.05]">
				${data.mailServers.map((mx) => `<div class="flex items-center gap-4 px-4 py-3 hover:bg-white/[0.015] transition-colors"><span class="text-xs text-slate-300 font-mono font-bold w-12">P:${mx.priority}</span><span class="text-sm font-mono text-white font-medium">${escapeHtml(mx.server)}</span></div>`).join('')}
			</div>
		</div>`;
	}

	// === Section 14: Open Graph / Social ===
	const ogKeys = data.openGraph ? Object.keys(data.openGraph) : [];
	if (ogKeys.length > 0) {
		html += `<details open class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
			<summary class="px-4 py-3 bg-cyber-elevated/40 border-b border-white/[0.08] cursor-pointer text-sm font-bold text-slate-200 uppercase tracking-wider hover:text-white transition-colors flex items-center gap-2">
				<span class="leading-none">Open Graph / Social (${ogKeys.length})</span>
				${reconTip('Open Graph and Twitter Card metadata for social media link previews.')}
			</summary>
			<div class="divide-y divide-white/[0.05]">`;
		const ogImage = data.openGraph['og:image'];
		if (ogImage) {
			html += `<div class="p-4 flex items-center gap-4"><img src="${escapeHtml(ogImage)}" alt="OG Image" class="h-16 rounded-xl border border-white/[0.1] object-cover" onerror="this.style.display='none'"/><div class="text-xs text-slate-300 break-all font-mono font-medium">${escapeHtml(ogImage)}</div></div>`;
		}
		for (const [key, value] of Object.entries(data.openGraph)) {
			if (key === 'og:image') continue;
			html += `<div class="flex gap-3 px-4 py-2.5 text-xs hover:bg-white/[0.015] transition-colors"><span class="font-mono text-slate-300 font-bold whitespace-nowrap min-w-[130px]">${escapeHtml(key)}</span><span class="text-slate-300 break-all font-mono">${escapeHtml(String(value))}</span></div>`;
		}
		html += `</div></details>`;
	}

	// === Section 15: Feeds + Emails ===
	const feeds = data.pageMeta?.feeds || [];
	const emails = data.pageMeta?.emails || [];
	if (feeds.length > 0 || emails.length > 0) {
		html += `<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">`;
		if (feeds.length > 0) {
			html += `<div class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden shadow-none">
				<div class="px-4 py-3 border-b border-white/[0.08] bg-cyber-elevated/40 flex items-center justify-between">
					<div class="flex items-center gap-2 min-w-0">
						<h4 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-0 leading-none">RSS / Atom Feeds (${feeds.length})</h4>
						${reconTip('RSS and Atom feed URLs found in the HTML.')}
					</div>
				</div>
				<div class="divide-y divide-white/[0.05]">`;
			for (const feed of feeds) {
				html += `<div class="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.015] transition-colors"><span class="px-2.5 py-0.5 text-[11px] font-bold rounded-md bg-orange-500/15 text-orange-400 border border-orange-500/30">${escapeHtml(feed.type)}</span><span class="text-xs text-slate-300 break-all font-mono font-medium">${escapeHtml(feed.href)}</span></div>`;
			}
			html += `</div></div>`;
		}
		if (emails.length > 0) {
			html += `<div class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden shadow-none">
				<div class="px-4 py-3 border-b border-white/[0.08] bg-cyber-elevated/40 flex items-center justify-between">
					<div class="flex items-center gap-2 min-w-0">
						<h4 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-0 leading-none">Email Addresses (${emails.length})</h4>
						${reconTip('Email addresses found in the HTML source.')}
					</div>
				</div>
				<div class="divide-y divide-white/[0.05]">`;
			for (const email of emails) {
				html += `<div class="px-4 py-3 hover:bg-white/[0.015] transition-colors"><span class="text-sm font-mono text-amber-300/90 font-medium">${escapeHtml(email)}</span></div>`;
			}
			html += `</div></div>`;
		}
		html += `</div>`;
	}

	// === Section 16: Path Probing ===
	if (data.probes && data.probes.length > 0) {
		html += `<div class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
			<div class="px-4 py-3 border-b border-white/[0.08] bg-cyber-elevated/40 flex items-center justify-between">
				<div class="flex items-center gap-2 min-w-0">
					<h4 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-0 leading-none">Path Probing</h4>
					${reconTip('Common paths checked: robots.txt, sitemap.xml, admin panels, security.txt. Green = accessible, gray = not found.')}
				</div>
			</div>
			<div class="divide-y divide-white/[0.05]">`;
		for (const probe of data.probes) {
			const statusColor = probe.exists ? 'text-emerald-400' : 'text-slate-500';
			const statusBg = probe.exists ? 'bg-emerald-500/[0.03]' : '';
			html += `<div class="flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.015] transition-colors ${statusBg}">
				<div class="flex items-center gap-3">
					<span class="w-2 h-2 rounded-full ${probe.exists ? 'bg-emerald-400' : 'bg-slate-600'} flex-shrink-0"></span>
					<span class="text-sm font-mono ${statusColor} font-medium">${escapeHtml(probe.path)}</span>
					<span class="text-xs text-slate-300">${escapeHtml(probe.name)}</span>
				</div>
				<span class="text-xs font-mono ${probe.exists ? 'text-emerald-400 font-bold' : 'text-slate-500'}">${probe.status || '—'}</span>
			</div>`;
		}
		html += `</div></div>`;
		for (const probe of data.probes) {
			if (probe.snippet) {
				html += `<div class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
					<div class="px-4 py-3 border-b border-white/[0.08] bg-cyber-elevated/40">
						<h4 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-0 leading-none">${escapeHtml(probe.name)} Content</h4>
					</div>
					<pre class="p-4 text-xs font-mono text-slate-300 bg-cyber-elevated/20 overflow-x-auto max-h-48 overflow-y-auto leading-relaxed">${escapeHtml(probe.snippet)}</pre>
				</div>`;
			}
		}
	}

	// === Section 17: TXT Records ===
	if (data.txtRecords && data.txtRecords.length > 0) {
		html += `<details open class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
			<summary class="px-4 py-3 bg-cyber-elevated/40 border-b border-white/[0.08] cursor-pointer text-sm font-bold text-slate-200 uppercase tracking-wider hover:text-white transition-colors flex items-center gap-2">
				<span class="leading-none">TXT Records (${data.txtRecords.length})</span>
				${reconTip('DNS TXT records contain verification tokens, SPF policies, DKIM keys, and other metadata published for the domain.')}
			</summary>
			<div class="p-4 space-y-1.5 max-h-48 overflow-y-auto">
				${data.txtRecords.map((txt) => `<div class="text-xs font-mono text-slate-300 break-all py-2 border-b border-white/[0.05] last:border-0 leading-relaxed">${escapeHtml(txt)}</div>`).join('')}
			</div>
		</details>`;
	}

	// === Section 18: Discovered Subdomains ===
	if (data.subdomains && data.subdomains.length > 0) {
		const stats = data.subdomainStats || {};
		html += `<div class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
			<div class="px-4 py-3 border-b border-white/[0.08] bg-cyber-elevated/40 flex items-center justify-between">
				<div class="flex items-center gap-2 min-w-0">
					<h4 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-0 leading-none">Discovered Subdomains (${data.subdomains.length})</h4>
					${reconTip('Subdomains found via Certificate Transparency logs (crt.sh) and DNS brute-force of common prefixes (www, mail, api, etc.).')}
				</div>
				<div class="flex gap-2">
					${stats.fromCT ? `<span class="text-[11px] px-2.5 py-0.5 rounded-lg bg-cyber-accent/15 text-cyber-accent border border-cyber-accent/30 font-bold">CT: ${stats.fromCT}</span>` : ''}
					${stats.fromDNS ? `<span class="text-[11px] px-2.5 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">DNS: ${stats.fromDNS}</span>` : ''}
				</div>
			</div>
			<div class="max-h-80 overflow-y-auto divide-y divide-white/[0.05]">`;
		for (const sub of data.subdomains) {
			const srcColor =
				sub.source === 'DNS + CT'
					? 'text-cyber-accent bg-cyber-accent/10 border-cyber-accent/30'
					: sub.source === 'DNS'
						? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
						: 'text-cyber-accent bg-cyber-accent/10 border-cyber-accent/30';
			html += `<div class="flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.015] transition-colors">
				<div class="flex items-center gap-2.5 min-w-0">
					<span class="w-2 h-2 rounded-full ${sub.ip ? 'bg-emerald-400' : 'bg-slate-600'} flex-shrink-0"></span>
					<span class="text-sm font-mono text-white whitespace-nowrap font-medium">${escapeHtml(sub.name)}</span>
				</div>
				<div class="flex items-center gap-2.5 flex-shrink-0 ml-2">
					${sub.ip ? `<span class="text-xs font-mono text-slate-300 whitespace-nowrap font-medium">${escapeHtml(sub.ip)}</span>` : '<span class="text-xs text-slate-500 whitespace-nowrap">no A record</span>'}
					<span class="text-[11px] px-2.5 py-0.5 rounded-md border ${srcColor} font-bold whitespace-nowrap">${escapeHtml(sub.source)}</span>
				</div>
			</div>`;
		}
		html += `</div></div>`;
	}

	// === Section 19: Reverse IP / Shared Hosting ===
	if (data.reverseIpDomains && data.reverseIpDomains.length > 0) {
		const domains = data.reverseIpDomains;
		const targetHost = data.hostname?.toLowerCase() || '';
		const otherDomains = domains.filter((d) => d !== targetHost);
		html += `<div class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
			<div class="px-4 py-3 border-b border-white/[0.08] bg-cyber-elevated/40 flex items-center justify-between">
				<div class="flex items-center gap-2 min-w-0">
					<h4 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-0 leading-none">Reverse IP — Shared Hosting (${otherDomains.length} domain${otherDomains.length > 1 ? 's' : ''})</h4>
					${reconTip('Domains hosted on the same IP address (shared hosting).')}
				</div>
				${data.dns?.ipAddresses?.[0] ? `<span class="text-xs font-mono text-slate-300 bg-cyber-elevated px-2.5 py-1 rounded-md border border-white/[0.08] font-medium">${escapeHtml(data.dns.ipAddresses[0])}</span>` : ''}
			</div>
			<div class="max-h-64 overflow-y-auto divide-y divide-white/[0.05]">`;
		for (const domain of otherDomains) {
			html += `<div class="flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.015] transition-colors">
				<div class="flex items-center gap-2.5 min-w-0">
					<span class="w-1.5 h-1.5 rounded-full bg-slate-600 flex-shrink-0"></span>
					<span class="text-sm font-mono text-white whitespace-nowrap font-medium">${escapeHtml(domain)}</span>
				</div>
				<a href="https://${escapeHtml(domain)}" target="_blank" rel="noopener" class="text-slate-400 hover:text-white transition-colors flex-shrink-0 ml-2">
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
				</a>
			</div>`;
		}
		html += `</div></div>`;
	}

	// === Section 20: All Response Headers ===
	if (data.responseHeaders) {
		html += `<details class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden mb-4 shadow-none">
			<summary class="px-4 py-3 bg-cyber-elevated/40 border-b border-white/[0.08] cursor-pointer text-sm font-bold text-slate-200 uppercase tracking-wider hover:text-white transition-colors flex items-center gap-2">
				<span class="leading-none">All Response Headers (${Object.keys(data.responseHeaders).length})</span>
				${reconTip('Complete HTTP response headers. May reveal server software, caching, security policies.')}
			</summary>
			<div class="p-4 max-h-64 overflow-y-auto space-y-1.5">`;
		for (const [key, value] of Object.entries(data.responseHeaders)) {
			html += `<div class="flex gap-2.5 text-xs py-1.5 border-b border-white/[0.04] last:border-0"><span class="font-mono text-slate-300 font-semibold whitespace-nowrap">${escapeHtml(key)}:</span><span class="font-mono text-slate-300 break-all">${escapeHtml(String(value))}</span></div>`;
		}
		html += `</div></details>`;
	}

	html += `</div>`;
	resultsDiv.innerHTML = html;
}


// Expose to window for global access
window.lastFullReconData = lastFullReconData;
window.lastDNSReconData = lastDNSReconData;
window.runFullRecon = runFullRecon;
window.displayFullReconResults = displayFullReconResults;
window.displayDNSReconResults = displayDNSReconResults;
