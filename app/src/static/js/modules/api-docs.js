/**
 * WAF-Checker - API Documentation Slide-down Panel
 */

// =============================================
// API DOCUMENTATION PANEL (slide-down)
// =============================================
let _apiPanelOpen = false;

function showAPIDocsModal() {
	openAPIPanel();
}

function openAPIPanel() {
	const panel = document.getElementById('apiDocsPanel');
	const sheet = document.getElementById('apiDocsSheet');
	const backdrop = document.getElementById('apiDocsBackdrop');
	if (!panel || !sheet) return;
	if (_apiPanelOpen) return;
	_apiPanelOpen = true;

	// Hide main header and disclaimer so only API panel is visible
	document.body.classList.add('api-panel-open');

	// Render content first
	renderAPIDocsContent();

	// Show container
	panel.style.visibility = 'visible';
	document.body.style.overflow = 'hidden';

	// Trigger animation on next frame
	requestAnimationFrame(() => {
		sheet.style.transform = 'translateY(0)';
		if (backdrop) backdrop.style.background = 'rgba(0,0,0,.55)';
	});
}

function closeAPIPanel() {
	const panel = document.getElementById('apiDocsPanel');
	const sheet = document.getElementById('apiDocsSheet');
	const backdrop = document.getElementById('apiDocsBackdrop');
	if (!panel || !sheet || !_apiPanelOpen) return;
	_apiPanelOpen = false;

	// Restore main header and disclaimer
	document.body.classList.remove('api-panel-open');

	// Animate out
	sheet.style.transform = 'translateY(-100%)';
	if (backdrop) backdrop.style.background = 'rgba(0,0,0,0)';

	// Hide after animation
	setTimeout(() => {
		if (!_apiPanelOpen) {
			panel.style.visibility = 'hidden';
			document.body.style.overflow = '';
		}
	}, 400);
}

// Close on Escape key
document.addEventListener('keydown', function (e) {
	if (e.key === 'Escape' && _apiPanelOpen) closeAPIPanel();
});

function renderAPIDocsContent() {
	const body = document.getElementById('apiDocsBody');
	if (!body) return;

	const baseUrl = window.location.origin + '/api/v1';

	const endpoints = [
		{
			id: 'waf-checker',
			path: '/waf-checker',
			color: '#f05627',
			label: 'WAF Checker',
			icon: '🛡️',
			desc: 'Run WAF payload tests with all advanced options: method selection, payload categories, encoding variations, auto WAF detection and bypass adaptation.',
			params: [
				{ name: 'url', required: true, type: 'string', desc: 'Target URL' },
				{
					name: 'methods',
					required: false,
					type: 'string',
					desc: 'HTTP methods (comma-separated)',
					default: 'GET',
					example: 'GET,POST,PUT',
				},
				{ name: 'categories', required: false, type: 'string', desc: 'Payload categories to test (comma-separated)' },
				{ name: 'page', required: false, type: 'number', desc: 'Pagination (50 results/page)', default: '0' },
				{ name: 'followRedirect', required: false, type: '0|1', desc: 'Follow HTTP redirects' },
				{ name: 'falsePositiveTest', required: false, type: '0|1', desc: 'Include false-positive control payloads' },
				{ name: 'caseSensitiveTest', required: false, type: '0|1', desc: 'Test case-sensitivity of WAF rules' },
				{ name: 'enhancedPayloads', required: false, type: '0|1', desc: 'Enhanced payload set with encoding variations' },
				{ name: 'advancedPayloads', required: false, type: '0|1', desc: 'Advanced WAF bypass payloads' },
				{ name: 'autoDetectWAF', required: false, type: '0|1', desc: 'Auto-detect WAF and adapt payloads' },
				{ name: 'encodingVariations', required: false, type: '0|1', desc: 'URL, double-URL, Unicode encoding' },
				{ name: 'httpManipulation', required: false, type: '0|1', desc: 'Verb tampering, param pollution, etc.' },
				{ name: 'detectedWAF', required: false, type: 'string', desc: 'Pre-detected WAF name for adaptation' },
				{ name: 'payloadTemplate', required: false, type: 'string', desc: 'Custom JSON body (use {{payload}})' },
				{ name: 'headers', required: false, type: 'string', desc: 'Custom HTTP headers' },
			],
			curlSuffix: '&methods=GET,POST&followRedirect=1',
		},
		{
			id: 'recon',
			path: '/recon',
			color: '#10b981',
			label: 'Full Recon',
			icon: '🔍',
			desc: 'Comprehensive reconnaissance: DNS records, WHOIS/RDAP, technologies, SSL/TLS, subdomains, reverse IP, security headers.',
			params: [{ name: 'url', required: true, type: 'string', desc: 'Target URL' }],
		},
		{
			id: 'security-headers',
			path: '/security-headers',
			color: '#f05627',
			label: 'Security Headers',
			icon: '🔒',
			desc: 'Audit HTTP security headers with individual grades, missing headers detection and actionable recommendations.',
			params: [{ name: 'url', required: true, type: 'string', desc: 'Target URL' }],
		},
		{
			id: 'speedtest',
			path: '/speedtest',
			color: '#f59e0b',
			label: 'Speed Test',
			icon: '⚡',
			desc: 'Performance analysis: DNS/TTFB timing, estimated Core Web Vitals, resource breakdown, Lighthouse-style scores and optimization advice.',
			params: [{ name: 'url', required: true, type: 'string', desc: 'Target URL' }],
		},
		{
			id: 'seo',
			path: '/seo',
			color: '#84cc16',
			label: 'SEO Audit',
			icon: '📊',
			desc: 'Full SEO audit: meta tags, headings, internal/external links, sitemap, robots.txt, structured data, accessibility, keyword density.',
			params: [{ name: 'url', required: true, type: 'string', desc: 'Target URL' }],
		},
		{
			id: 'http-manipulation',
			path: '/http-manipulation',
			color: '#ef4444',
			label: 'HTTP Manipulation',
			icon: '🧪',
			desc: 'Test HTTP manipulation techniques: verb tampering, parameter pollution, content-type confusion, host header injection.',
			params: [{ name: 'url', required: true, type: 'string', desc: 'Target URL' }],
		},
	];

	let html = `<div style="max-width:960px;margin:0 auto;padding:1.5rem 1.25rem">`;
	/* ── Hero ── */
	html += `
	<div style="text-align:center;margin-bottom:1.25rem">
		<h1 style="font-size:1.4rem;font-weight:800;color:#e5e7eb;margin:0 0 .35rem">Public API</h1>
		<p style="font-size:.75rem;color:#6b7280;max-width:480px;margin:0 auto">All tools via REST. JSON, no auth, rate-limited.</p>
	</div>`;
	/* ── TOP: Rate Limit, Auth, Format + Error codes ── */
	html += `
	<div style="background:#151c2e;border:1px solid rgba(240,86,39,.12);border-radius:12px;padding:1rem 1.25rem;margin-bottom:1.5rem">
		<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-bottom:1rem">
			<div style="display:flex;align-items:flex-start;gap:10px">
				<div style="width:28px;height:28px;border-radius:8px;background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.25);flex-shrink:0;display:flex;align-items:center;justify-content:center">
					<svg style="width:14px;height:14px;color:#f59e0b" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
				</div>
				<div>
					<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#6b7280;margin-bottom:4px">Rate Limit</div>
					<div style="font-size:1.1rem;font-weight:800;color:#f59e0b;line-height:1.2">1 req/min/IP</div>
					<div style="font-size:10px;color:#4b5563;margin-top:4px">Headers: <code style="color:#6b7280;font-size:9px">X-RateLimit-Limit</code> &bull; <code style="color:#6b7280;font-size:9px">Remaining</code> &bull; <code style="color:#6b7280;font-size:9px">Reset</code></div>
				</div>
			</div>
			<div style="display:flex;align-items:flex-start;gap:10px">
				<div style="width:28px;height:28px;border-radius:8px;background:rgba(16,185,129,.12);border:1px solid rgba(16,185,129,.25);flex-shrink:0;display:flex;align-items:center;justify-content:center">
					<svg style="width:14px;height:14px;color:#10b981" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"/></svg>
				</div>
				<div>
					<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#6b7280;margin-bottom:4px">Auth</div>
					<div style="font-size:.8rem;color:#d1d5db;line-height:1.4">No key needed. <span style="color:#10b981;font-weight:600">Public API</span>. URL auto-normalized.</div>
				</div>
			</div>
			<div style="display:flex;align-items:flex-start;gap:10px">
				<div style="width:28px;height:28px;border-radius:8px;background:rgba(240,86,39,.12);border:1px solid rgba(240,86,39,.25);flex-shrink:0;display:flex;align-items:center;justify-content:center">
					<svg style="width:14px;height:14px;color:#f05627" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
				</div>
				<div>
					<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#6b7280;margin-bottom:4px">Format</div>
					<div style="font-size:.8rem;color:#d1d5db;line-height:1.4"><code style="color:#f05627;font-weight:600">JSON</code>. Use <code style="color:#6b7280">jq .</code> or <code style="color:#6b7280">-o file.json</code></div>
				</div>
			</div>
		</div>
		<div style="border-top:1px solid rgba(255,255,255,.06);padding-top:10px;display:flex;flex-wrap:wrap;align-items:center;gap:8px">
			<span style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#4b5563;margin-right:4px">Errors</span>
			${[
				{ code: '400', color: '#f59e0b', label: 'Bad param' },
				{ code: '404', color: '#f59e0b', label: 'Not found' },
				{ code: '429', color: '#ef4444', label: 'Rate limit' },
				{ code: '500', color: '#ef4444', label: 'Server error' },
				{ code: '502', color: '#ef4444', label: 'Unreachable' },
			]
				.map(
					(
						e,
					) => `<span style="display:inline-flex;align-items:center;gap:6px;background:rgba(0,0,0,.25);border:1px solid ${e.color}22;border-radius:6px;padding:4px 10px;font-size:11px">
				<code style="font-weight:700;font-family:monospace;color:${e.color}">${e.code}</code>
				<span style="color:#9ca3af">${e.label}</span>
			</span>`,
				)
				.join('')}
		</div>
	</div>`;

	/* ── Target URL input ── */
	html += `
	<div style="background:#151c2e;border:1px solid rgba(240,86,39,.15);border-radius:10px;padding:12px 16px;margin-bottom:1.5rem;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
		<label style="font-size:.65rem;text-transform:uppercase;letter-spacing:.08em;color:#4b5563;font-weight:700;white-space:nowrap">Target</label>
		<div style="flex:1;min-width:180px">
			<input id="apiDocsDomain" type="text" value="https://example.com" spellcheck="false"
				style="width:100%;background:#0f1523;border:1px solid rgba(240,86,39,.2);border-radius:6px;padding:7px 12px;font-family:monospace;font-size:.82rem;color:#f05627;outline:none;transition:border-color .2s"
				onfocus="this.style.borderColor='rgba(240,86,39,.5)'" onblur="this.style.borderColor='rgba(240,86,39,.2)'"
				oninput="updateApiExamples()" />
		</div>
		<span style="font-size:.6rem;color:#374151;white-space:nowrap">&#x2190; modifies all curl below</span>
	</div>`;

	/* ── Base URL ── */
	html += `
	<div style="display:flex;align-items:center;gap:8px;margin-bottom:1.5rem;font-size:.72rem">
		<span style="color:#4b5563">Base URL</span>
		<code style="color:#f05627;font-family:monospace;background:#0f1523;border:1px solid rgba(240,86,39,.15);padding:4px 10px;border-radius:6px">${baseUrl}</code>
	</div>`;

	/* ── Endpoints ── */
	for (const ep of endpoints) {
		const suffix = ep.curlSuffix || '';
		const hasAdvanced = ep.params.length > 1;

		html += `
		<div style="background:#0d1117;border:1px solid ${ep.color}20;border-radius:10px;overflow:hidden;margin-bottom:12px" id="ep-${ep.id}">
			<!-- Header row -->
			<div style="display:flex;align-items:center;padding:10px 16px;gap:10px;background:${ep.color}06">
				<span style="font-size:13px">${ep.icon}</span>
				<span style="background:${ep.color}15;color:${ep.color};font-size:10px;font-weight:700;font-family:monospace;padding:2px 7px;border-radius:4px">GET</span>
				<code style="font-size:.8rem;color:#e5e7eb;font-weight:600;font-family:monospace">/api/v1${ep.path}</code>
				<span style="margin-left:auto;font-size:.68rem;color:#4b5563;font-weight:600">${ep.label}</span>
			</div>
			<!-- Body -->
			<div style="padding:12px 16px 14px">
				<p style="font-size:.73rem;color:#6b7280;margin:0 0 10px;line-height:1.5">${ep.desc}</p>`;

		/* ── Parameters table ── */
		if (hasAdvanced) {
			html += `
				<details style="margin-bottom:10px">
					<summary style="font-size:.65rem;text-transform:uppercase;letter-spacing:.06em;color:#4b5563;font-weight:700;cursor:pointer;padding:4px 0;user-select:none">
						Parameters <span style="color:#374151">(${ep.params.length})</span>
					</summary>
					<div style="margin-top:6px;border:1px solid #1e293b;border-radius:8px;overflow:hidden;background:#0f1523">
						<table style="width:100%;border-collapse:collapse;font-size:.7rem">
							<thead><tr style="border-bottom:1px solid #1e293b">
								<th style="text-align:left;padding:6px 10px;color:#94a3b8;font-weight:600">Param</th>
								<th style="text-align:left;padding:6px 10px;color:#94a3b8;font-weight:600">Type</th>
								<th style="text-align:left;padding:6px 10px;color:#94a3b8;font-weight:600">Description</th>
							</tr></thead>
							<tbody>
								${ep.params
									.map(
										(p) => `<tr style="border-bottom:1px solid #1e293b10">
									<td style="padding:5px 10px;white-space:nowrap"><code style="color:${p.required ? '#f05627' : '#94a3b8'};font-weight:${p.required ? '600' : '400'}">${p.name}</code>${p.required ? '<span style="color:#ef4444;font-size:8px;margin-left:3px">*</span>' : ''}</td>
									<td style="padding:5px 10px;color:#64748b;font-family:monospace;font-size:.65rem">${p.type}</td>
									<td style="padding:5px 10px;color:#94a3b8">${p.desc}${p.default ? ` <span style="color:#64748b">(default: ${p.default})</span>` : ''}</td>
								</tr>`,
									)
									.join('')}
							</tbody>
						</table>
					</div>
				</details>`;
		} else {
			html += `
				<div style="font-size:.65rem;color:#94a3b8;margin-bottom:10px">
					Parameter: <code style="color:#f05627;font-weight:600">url</code><span style="color:#ef4444;font-size:8px;margin-left:2px">*</span> <span style="color:#64748b">(string)</span>
				</div>`;
		}

		/* ── cURL block ── */
		html += `
				<div style="background:#0f1523;border:1px solid #1e293b;border-radius:8px;overflow:hidden">
					<div style="display:flex;align-items:center;justify-content:space-between;padding:5px 12px;border-bottom:1px solid #1e293b40">
						<span style="font-size:9px;color:#64748b;font-family:monospace;text-transform:uppercase;letter-spacing:.05em">curl</span>
						<span class="copy-icon" style="cursor:pointer;color:#64748b;transition:color .15s" onmouseenter="this.style.color='#94a3b8'" onmouseleave="this.style.color='#64748b'" onclick="copyApiCmd(this,'${ep.path}','${suffix.replace(/'/g, "\\'")}')">
							<svg style="width:13px;height:13px" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" stroke-width="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke-width="2"/></svg>
						</span>
					</div>
					<div style="padding:8px 14px;font-family:monospace;font-size:.76rem;overflow-x:auto;white-space:nowrap;line-height:1.7">
						<span style="color:#64748b">$ </span><span style="color:#94a3b8">curl</span> <span style="color:#64748b">"</span><span style="color:#94a3b8">${baseUrl}${ep.path}?url=</span><span class="api-target-url" style="color:#f05627">https://example.com</span><span style="color:#94a3b8">${suffix}</span><span style="color:#64748b">"</span>
					</div>
				</div>
			</div>
		</div>`;
	}

	/* ── Footer ── */
	html += `
	<div style="text-align:center;padding:.8rem 0 2rem;border-top:1px solid #1e293b20">
		<span style="font-size:.62rem;color:#374151">JSON docs: <code style="color:#4b5563;background:#111720;padding:2px 8px;border-radius:4px">curl ${baseUrl}/docs | jq .</code></span>
	</div>`;

	html += `</div>`;
	body.innerHTML = html;
}

function updateApiExamples() {
	const input = document.getElementById('apiDocsDomain');
	if (!input) return;
	const val = input.value.trim() || 'https://example.com';
	document.querySelectorAll('.api-target-url').forEach((el) => {
		el.textContent = val;
	});
}

function copyApiCmd(iconEl, path, suffix) {
	const baseUrl = window.location.origin + '/api/v1';
	const domain = (document.getElementById('apiDocsDomain')?.value || 'https://example.com').trim();
	const cmd = `curl "${baseUrl}${path}?url=${encodeURIComponent(domain)}${suffix || ''}"`;
	navigator.clipboard.writeText(cmd).then(() => {
		const orig = iconEl.innerHTML;
		iconEl.innerHTML =
			'<svg style="width:13px;height:13px;color:#10b981" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>';
		setTimeout(() => {
			iconEl.innerHTML = orig;
		}, 1200);
	});
}


// Expose to window for global access
window.showAPIDocsModal = showAPIDocsModal;
window.openAPIPanel = openAPIPanel;
window.closeAPIPanel = closeAPIPanel;
window.renderAPIDocsContent = renderAPIDocsContent;
window.updateApiExamples = updateApiExamples;
window.copyApiCmd = copyApiCmd;
