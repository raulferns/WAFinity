/**
 * WAF-Checker - HTTP Status Codes Modal & Helpers
 */

// ===========================================
// HTTP STATUS CODES MODAL
// ===========================================

const HTTP_CODES_DATA = [
	// --- 2xx Success ---
	{
		code: '200',
		name: 'OK',
		group: '2xx',
		normal: 'Request succeeded - <strong class="text-cyber-danger">VULNERABLE</strong> (attack payload passed through WAF)',
		falsePositive: '<strong class="text-cyber-success">GOOD</strong> - Legitimate benign request allowed',
		httpManip: '<strong class="text-cyber-danger">BYPASS</strong> - Manipulation succeeded, WAF did not block',
		bg: 'bg-cyber-danger/5',
	},
	{
		code: '201',
		name: 'Created',
		group: '2xx',
		normal: 'Resource created - <strong class="text-cyber-danger">VULNERABLE</strong> (attack payload succeeded)',
		falsePositive: '<strong class="text-cyber-success">GOOD</strong> - Resource created successfully',
		httpManip: 'Resource created - <strong class="text-cyber-danger">BYPASS</strong>',
		bg: 'bg-cyber-danger/5',
	},
	{
		code: '202',
		name: 'Accepted',
		group: '2xx',
		normal: 'Request accepted for processing - <strong class="text-cyber-danger">VULNERABLE</strong>',
		falsePositive: '<strong class="text-cyber-success">GOOD</strong> - Request queued / accepted successfully',
		httpManip: 'Request accepted - <strong class="text-cyber-danger">BYPASS</strong>',
		bg: 'bg-cyber-danger/5',
	},
	{
		code: '204',
		name: 'No Content',
		group: '2xx',
		normal: 'Success with no content - <strong class="text-cyber-danger">VULNERABLE</strong>',
		falsePositive: '<strong class="text-cyber-success">GOOD</strong> - Request processed cleanly with no response body',
		httpManip: 'Success with no content - <strong class="text-cyber-danger">BYPASS</strong>',
		bg: 'bg-cyber-danger/5',
	},

	// --- 3xx Redirection ---
	{
		code: '301',
		name: 'Moved Permanently',
		group: '3xx',
		normal: 'Permanent redirect - Check Location header (may redirect to WAF block or challenge page)',
		falsePositive: 'Permanent redirect - Normal URL canonicalization or HTTPS upgrade',
		httpManip: 'Permanent redirect - Check if WAF redirecting to captcha/block page',
		bg: 'bg-orange-500/5',
	},
	{
		code: '302',
		name: 'Found',
		group: '3xx',
		normal: 'Temporary redirect - Often used by WAFs to route to challenge / interstitial captcha',
		falsePositive: 'Temporary redirect - Legitimate redirect (e.g. login gate or localized route)',
		httpManip: 'Temporary redirect - May indicate WAF redirecting to block/verification flow',
		bg: 'bg-orange-500/5',
	},
	{
		code: '307',
		name: 'Temporary Redirect',
		group: '3xx',
		normal: 'Temporary redirect (method preserved) - Investigate destination in Location header',
		falsePositive: 'Temporary redirect (method preserved) - Application routing',
		httpManip: 'Temporary redirect (method preserved) - Investigate Location header',
		bg: 'bg-orange-500/5',
	},
	{
		code: '308',
		name: 'Permanent Redirect',
		group: '3xx',
		normal: 'Permanent redirect (method preserved) - Investigate destination in Location header',
		falsePositive: 'Permanent redirect - Application canonicalization',
		httpManip: 'Permanent redirect - Check if manipulation triggered redirect',
		bg: 'bg-orange-500/5',
	},

	// --- 4xx Client & WAF Rejections ---
	{
		code: '400',
		name: 'Bad Request',
		group: '4xx',
		normal: 'Bad Request - Request syntax malformed or blocked at protocol inspection layer',
		falsePositive: '<strong class="text-amber-400">SUSPICIOUS</strong> - Benign payload rejected as malformed syntax by server or WAF',
		httpManip: 'Bad Request - Server or WAF rejected manipulated headers/parameters',
		bg: 'bg-orange-500/5',
	},
	{
		code: '401',
		name: 'Unauthorized',
		group: '4xx',
		normal: 'Unauthorized - Authentication required; payload stopped by auth gate before WAF',
		falsePositive: 'Unauthorized - Target endpoint requires authentication credentials',
		httpManip: 'Unauthorized - Auth required before manipulation reached backend',
		bg: 'bg-orange-500/5',
	},
	{
		code: '403',
		name: 'Forbidden',
		group: '4xx',
		normal: '<strong class="text-cyber-success">PROTECTED</strong> - WAF inspected and blocked the attack payload',
		falsePositive: '<strong class="text-cyber-danger">FALSE POSITIVE</strong> - WAF incorrectly flagged and blocked a legitimate, safe request',
		httpManip: '<strong class="text-cyber-success">PROTECTED</strong> - WAF detected and blocked the manipulation attempt',
		bg: 'bg-cyber-success/5',
	},
	{
		code: '404',
		name: 'Not Found',
		group: '4xx',
		normal: 'Not Found - Endpoint does not exist or WAF masked rejection as 404',
		falsePositive: 'Not Found - Endpoint path missing or false positive masked as 404',
		httpManip: 'Not Found - Target endpoint does not exist or masked by WAF',
		bg: 'bg-orange-500/5',
	},
	{
		code: '405',
		name: 'Method Not Allowed',
		group: '4xx',
		normal: 'Method Not Allowed - HTTP method disabled or restricted by policy',
		falsePositive: '<strong class="text-amber-400">RESTRICTED</strong> - Legitimate HTTP method not permitted on this route',
		httpManip: 'Method Not Allowed - WAF or server blocked the manipulated HTTP verb',
		bg: 'bg-orange-500/5',
	},
	{
		code: '406',
		name: 'Not Acceptable',
		group: '4xx',
		normal: 'Not Acceptable - Server rejected Content-Type, Accept, or encoding (often WAF signature)',
		falsePositive: '<strong class="text-cyber-danger">FALSE POSITIVE</strong> - Benign request headers or character encodings rejected by WAF content negotiation',
		httpManip: 'Not Acceptable - WAF rejected manipulated encoding or accept headers',
		bg: 'bg-orange-500/5',
	},
	{
		code: '408',
		name: 'Request Timeout',
		group: '4xx',
		normal: 'Request Timeout - Server timed out waiting for the full request stream',
		falsePositive: '<strong class="text-amber-400">TIMEOUT</strong> - Connection timed out during benign transmission',
		httpManip: 'Request Timeout - Header manipulation slowed or stalled request processing',
		bg: 'bg-orange-500/5',
	},
	{
		code: '413',
		name: 'Payload Too Large',
		group: '4xx',
		normal: 'Payload Too Large - Request body exceeded max buffer size (WAF request size filter)',
		falsePositive: '<strong class="text-amber-400">PAYLOAD LIMIT</strong> - Benign payload exceeded server or WAF buffer limit',
		httpManip: 'Payload Too Large - Manipulated body or chunk size rejected',
		bg: 'bg-orange-500/5',
	},
	{
		code: '418',
		name: "I'm a Teapot",
		group: '4xx',
		normal: "I'm a Teapot - Honeypot response / intentional easter egg or Akamai WAF bot block",
		falsePositive: '<strong class="text-amber-400">HONEYPOT</strong> - Triggered custom deception / bot challenge rule on benign request',
		httpManip: "I'm a Teapot - WAF deception engine or custom rule block",
		bg: 'bg-orange-500/5',
	},
	{
		code: '422',
		name: 'Unprocessable Entity',
		group: '4xx',
		normal: 'Unprocessable Entity - Semantic syntax error; application validated payload format',
		falsePositive: 'Semantic syntax error - Application rejected payload schema format',
		httpManip: 'Unprocessable Entity - Target rejected manipulated parameter format',
		bg: 'bg-orange-500/5',
	},
	{
		code: '429',
		name: 'Too Many Requests',
		group: '4xx',
		normal: 'Too Many Requests - Rate limiting active; WAF or API gateway throttled scanning',
		falsePositive: '<strong class="text-amber-400">RATE LIMITED</strong> - Legitimate test rate-limited by aggressive threshold',
		httpManip: 'Too Many Requests - Rate limiter triggered by rapid manipulation probes',
		bg: 'bg-orange-500/5',
	},
	{
		code: '444',
		name: 'Connection Closed (Nginx)',
		group: '4xx',
		normal: 'No Response - Nginx dropped connection without sending headers (WAF drop rule)',
		falsePositive: '<strong class="text-cyber-danger">FALSE POSITIVE (DROP)</strong> - Nginx/WAF abruptly dropped TCP connection on benign request',
		httpManip: 'No Response - Nginx/WAF forcibly closed connection on anomalous request',
		bg: 'bg-orange-500/5',
	},
	{
		code: '499',
		name: 'Client Closed Request',
		group: '4xx',
		normal: 'Client Closed - Client closed connection while server was still processing (Nginx)',
		falsePositive: 'Client Closed - Connection closed before server response completed',
		httpManip: 'Client Closed - Timeout during manipulation handshake',
		bg: 'bg-orange-500/5',
	},

	// --- 5xx Standard Server Errors ---
	{
		code: '500',
		name: 'Internal Server Error',
		group: '5xx',
		normal: '<strong class="text-cyber-warning">SERVER ERROR</strong> - Unhandled backend crash; payload caused backend exception or WAF crash',
		falsePositive: '<strong class="text-cyber-danger">SERVER ERROR</strong> - Backend crashed or unhandled exception while processing safe payload',
		httpManip: 'Server Error - Backend failed to handle manipulated protocol structure',
		bg: 'bg-orange-500/5',
	},
	{
		code: '502',
		name: 'Bad Gateway',
		group: '5xx',
		normal: 'Bad Gateway - Upstream origin crashed or failed to respond to reverse proxy / WAF',
		falsePositive: '<strong class="text-cyber-danger">GATEWAY ERROR</strong> - Upstream origin server crashed or failed to respond to reverse proxy / WAF',
		httpManip: 'Bad Gateway - WAF or reverse proxy rejected backend communication',
		bg: 'bg-orange-500/5',
	},
	{
		code: '503',
		name: 'Service Unavailable',
		group: '5xx',
		normal: 'Service Unavailable - Target overloaded, under maintenance, or WAF temporary rate block',
		falsePositive: '<strong class="text-cyber-danger">UNAVAILABLE</strong> - Server overloaded, maintenance, or temporary anti-DDoS lockout',
		httpManip: 'Service Unavailable - Target temporarily refusing incoming connections',
		bg: 'bg-orange-500/5',
	},
	{
		code: '504',
		name: 'Gateway Timeout',
		group: '5xx',
		normal: 'Gateway Timeout - Origin took too long; may indicate blind SQLi sleep / ReDoS / heavy load',
		falsePositive: '<strong class="text-cyber-danger">GATEWAY TIMEOUT</strong> - Upstream origin server timed out during request processing',
		httpManip: 'Gateway Timeout - Upstream server or WAF timed out during processing',
		bg: 'bg-orange-500/5',
	},

	// --- Cloudflare & Edge Specific (520 - 530) ---
	{
		code: '520',
		name: 'Web Server Returned Unknown Error',
		group: 'cloudflare',
		normal: 'Cloudflare 520 - Origin server returned an empty, unknown, or unexpected response to Cloudflare WAF',
		falsePositive: '<strong class="text-cyber-danger">CLOUDFLARE ERROR</strong> - Origin server returned an empty, unknown, or unexpected response to Cloudflare WAF',
		httpManip: 'Cloudflare 520 - Manipulation corrupted origin HTTP response stream',
		bg: 'bg-red-500/5',
	},
	{
		code: '521',
		name: 'Web Server Is Down',
		group: 'cloudflare',
		normal: 'Cloudflare 521 - Origin web server refused TCP connection on port 80/443 (origin down or firewall blocked Cloudflare)',
		falsePositive: '<strong class="text-cyber-danger">ORIGIN DOWN</strong> - Origin web server refused TCP connection from Cloudflare edge proxy',
		httpManip: 'Cloudflare 521 - Origin refused connection from edge proxy',
		bg: 'bg-red-500/5',
	},
	{
		code: '522',
		name: 'Connection Timed Out',
		group: 'cloudflare',
		normal: 'Cloudflare 522 - TCP handshake between Cloudflare WAF and origin timed out (routing/firewall packet drop)',
		falsePositive: '<strong class="text-cyber-danger">TCP TIMEOUT</strong> - Cloudflare attempted TCP connection to origin server, but the handshake timed out',
		httpManip: 'Cloudflare 522 - TCP handshake timed out between edge and origin',
		bg: 'bg-red-500/5',
	},
	{
		code: '523',
		name: 'Origin Is Unreachable',
		group: 'cloudflare',
		normal: 'Cloudflare 523 - Cloudflare could not reach origin server due to routing / BGP / DNS resolution failure',
		falsePositive: '<strong class="text-cyber-danger">UNREACHABLE</strong> - Cloudflare could not reach origin server due to network routing or DNS resolution failure',
		httpManip: 'Cloudflare 523 - Origin network path unreachable',
		bg: 'bg-red-500/5',
	},
	{
		code: '524',
		name: 'A Timeout Occurred',
		group: 'cloudflare',
		normal: 'Cloudflare 524 - TCP connection succeeded but origin took >100s to send HTTP response (time-based injection or hang)',
		falsePositive: '<strong class="text-cyber-danger">RESPONSE TIMEOUT</strong> - TCP connection succeeded, but origin took over 100 seconds to send HTTP response headers',
		httpManip: 'Cloudflare 524 - Origin took too long to process manipulated request',
		bg: 'bg-red-500/5',
	},
	{
		code: '525',
		name: 'SSL Handshake Failed',
		group: 'cloudflare',
		normal: 'Cloudflare 525 - SSL/TLS handshake failed between Cloudflare and origin server (cipher mismatch, SNI failure, or missing cert)',
		falsePositive: '<strong class="text-cyber-danger">SSL HANDSHAKE FAILED</strong> - SSL/TLS handshake failed between Cloudflare and origin server (cipher mismatch, missing cert, or SNI misconfiguration)',
		httpManip: 'Cloudflare 525 - Manipulated request or SNI headers caused TLS handshake failure between edge and origin',
		bg: 'bg-red-500/5',
	},
	{
		code: '526',
		name: 'Invalid SSL Certificate',
		group: 'cloudflare',
		normal: 'Cloudflare 526 - Origin server SSL certificate is expired, self-signed, untrusted, or domain name does not match',
		falsePositive: '<strong class="text-cyber-danger">INVALID CERTIFICATE</strong> - Origin server TLS certificate expired, self-signed, or untrusted by Cloudflare Full (Strict)',
		httpManip: 'Cloudflare 526 - Origin certificate rejected by Cloudflare edge',
		bg: 'bg-red-500/5',
	},
	{
		code: '530',
		name: 'Cloudflare Error 530 (1xxx / DNS)',
		group: 'cloudflare',
		normal: 'Cloudflare 530 - Generic Cloudflare edge error (typically 10xx error, DNS resolution issue, or zone access restriction)',
		falsePositive: '<strong class="text-cyber-danger">CLOUDFLARE 530</strong> - Edge error or zone access restriction triggered on request (10xx error / DNS)',
		httpManip: 'Cloudflare 530 - Edge access restriction triggered',
		bg: 'bg-red-500/5',
	},

	// --- Network / Connection Failure ---
	{
		code: 'ERR',
		name: 'Connection / Network Error',
		group: 'error',
		normal: 'Network/connection error - Request failed to complete (DNS lookup failure, connection reset, or SSL rejection)',
		falsePositive: '<strong class="text-cyber-danger">NETWORK ERROR</strong> - DNS failure, TCP connection reset, or connection refused',
		httpManip: 'Network/connection error - Socket reset or abort during manipulation transmission',
		bg: 'bg-orange-500/5',
	},
];

let currentModalContext = 'normal';

function generateHttpCodesTable(context = 'normal') {
	currentModalContext = context;

	const contextLabels = {
		normal: 'Security Test Context',
		falsePositive: 'False Positive Test Context',
		httpManip: 'HTTP Manipulation Context',
	};

	let html = `
		<div class="mb-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
			<!-- Search bar -->
			<div class="relative flex-1">
				<input type="text" id="httpCodeSearchInput" oninput="filterHttpCodesTable()"
					   placeholder="Search by code, name, or description (e.g. 525, Cloudflare, 403, SSL)..."
					   class="w-full bg-[#12141f] border border-white/[0.1] rounded-xl px-3.5 py-2 pl-9 text-xs text-white placeholder-slate-500 focus:border-cyber-accent focus:ring-1 focus:ring-cyber-accent/30 outline-none transition-all" />
				<svg class="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
				</svg>
			</div>
			<!-- Category filter pills -->
			<div class="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0" id="httpCodeFilterPills">
				<button type="button" onclick="filterHttpCodesCategory('all')" data-cat="all"
						class="cat-pill active px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all border border-cyber-accent text-cyber-accent bg-cyber-accent/10">
					All (${HTTP_CODES_DATA.length})
				</button>
				<button type="button" onclick="filterHttpCodesCategory('2xx')" data-cat="2xx"
						class="cat-pill px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.05]">
					2xx Success
				</button>
				<button type="button" onclick="filterHttpCodesCategory('3xx')" data-cat="3xx"
						class="cat-pill px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.05]">
					3xx Redirect
				</button>
				<button type="button" onclick="filterHttpCodesCategory('4xx')" data-cat="4xx"
						class="cat-pill px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.05]">
					4xx Client / WAF
				</button>
				<button type="button" onclick="filterHttpCodesCategory('5xx')" data-cat="5xx"
						class="cat-pill px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.05]">
					5xx Server
				</button>
				<button type="button" onclick="filterHttpCodesCategory('cloudflare')" data-cat="cloudflare"
						class="cat-pill px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.05]">
					Cloudflare 520-530
				</button>
			</div>
		</div>

		<div class="rounded-xl border border-white/[0.08] overflow-hidden">
			<table class="w-full text-xs border-collapse" id="httpCodesTable">
				<thead>
					<tr class="bg-cyber-elevated/70 border-b border-white/[0.08]">
						<th class="px-3 py-2.5 text-left text-slate-300 font-bold w-20">Code</th>
						<th class="px-3 py-2.5 text-left text-slate-300 font-bold w-48">Name</th>
						<th class="px-3 py-2.5 text-left text-slate-300 font-bold">Meaning (${contextLabels[context] || contextLabels.normal})</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-white/[0.04]">`;

	HTTP_CODES_DATA.forEach((item) => {
		const meaning = item[context] || item.normal;

		let codeColor = 'text-amber-400';
		let rowBg = 'hover:bg-white/[0.02]';

		if (context === 'falsePositive') {
			if (item.code.startsWith('2')) {
				codeColor = 'text-emerald-400';
				rowBg = 'bg-emerald-500/[0.03] hover:bg-emerald-500/[0.06]';
			} else if (item.code === '403' || item.code.startsWith('5') || item.code === 'ERR') {
				codeColor = 'text-red-500';
				rowBg = 'bg-red-500/[0.04] hover:bg-red-500/[0.08]';
			}
		} else {
			if (item.code === '403') {
				codeColor = 'text-emerald-400';
				rowBg = 'bg-emerald-500/[0.03] hover:bg-emerald-500/[0.06]';
			} else if (item.code.startsWith('2')) {
				codeColor = 'text-red-500';
				rowBg = 'bg-red-500/[0.04] hover:bg-red-500/[0.08]';
			}
		}

		const cleanSearch = (item.code + ' ' + item.name + ' ' + meaning.replace(/<[^>]+>/g, '')).toLowerCase().replace(/"/g, '&quot;');

		html += `
			<tr class="${rowBg} transition-colors http-code-row" data-code="${item.code}" data-group="${item.group}" data-search="${cleanSearch}">
				<td class="px-3 py-2.5 font-mono font-bold ${codeColor} align-top whitespace-nowrap">
					<span class="inline-block px-1.5 py-0.5 rounded bg-black/40 border border-white/[0.05]">${item.code}</span>
				</td>
				<td class="px-3 py-2.5 font-semibold text-slate-200 align-top">${item.name}</td>
				<td class="px-3 py-2.5 text-slate-400 align-top leading-relaxed">${meaning}</td>
			</tr>`;
	});

	html += `
				</tbody>
			</table>
		</div>
		<div id="noHttpCodesMatch" class="hidden py-8 text-center text-slate-500 text-xs">
			No status codes matching your search filter.
		</div>`;

	return html;
}

let activeCategoryFilter = 'all';

function filterHttpCodesCategory(category) {
	activeCategoryFilter = category;

	// Update pills UI
	const pills = document.querySelectorAll('#httpCodeFilterPills .cat-pill');
	pills.forEach((p) => {
		if (p.getAttribute('data-cat') === category) {
			p.className = 'cat-pill active px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all border border-cyber-accent text-cyber-accent bg-cyber-accent/10';
		} else {
			p.className = 'cat-pill px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.05]';
		}
	});

	filterHttpCodesTable();
}

function filterHttpCodesTable() {
	const searchInput = document.getElementById('httpCodeSearchInput');
	const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
	const rows = document.querySelectorAll('#httpCodesTable .http-code-row');
	let visibleCount = 0;

	rows.forEach((row) => {
		const searchData = row.getAttribute('data-search') || '';
		const group = row.getAttribute('data-group') || '';

		const matchesCategory = (activeCategoryFilter === 'all') || (group === activeCategoryFilter);
		const matchesQuery = !query || searchData.includes(query);

		if (matchesCategory && matchesQuery) {
			row.style.display = '';
			visibleCount++;
		} else {
			row.style.display = 'none';
		}
	});

	const noMatchEl = document.getElementById('noHttpCodesMatch');
	if (noMatchEl) {
		noMatchEl.classList.toggle('hidden', visibleCount > 0);
	}
}

function showHttpCodesModal(context = 'normal') {
	const modal = document.getElementById('httpCodesModal');
	const titleEl = document.getElementById('httpCodesTitle');
	const contentEl = document.getElementById('httpCodesTableContent');

	const contextTitles = {
		normal: 'HTTP Status Codes Reference - Security Test',
		falsePositive: 'HTTP Status Codes Reference - False Positive Test',
		httpManip: 'HTTP Status Codes Reference - HTTP Manipulation Test',
	};

	titleEl.textContent = contextTitles[context] || contextTitles.normal;
	activeCategoryFilter = 'all';
	contentEl.innerHTML = generateHttpCodesTable(context);

	modal.style.display = 'flex';
	document.body.style.overflow = 'hidden';

	// Focus search input automatically
	setTimeout(() => {
		const input = document.getElementById('httpCodeSearchInput');
		if (input) input.focus();
	}, 100);
}

function closeHttpCodesModal() {
	const modal = document.getElementById('httpCodesModal');
	if (modal) {
		modal.style.display = 'none';
	}
	document.body.style.overflow = '';
}

// Handle Escape key for modals
document.addEventListener('keydown', (e) => {
	if (e.key === 'Escape') {
		const alertModal = document.getElementById('customAlertModal');
		const confirmModal = document.getElementById('customConfirmModal');
		const httpCodesModal = document.getElementById('httpCodesModal');

		if (httpCodesModal && httpCodesModal.style.display === 'flex') {
			closeHttpCodesModal();
			return;
		}
		if (alertModal && alertModal.style.display === 'flex') {
			closeAlert();
		}
		if (confirmModal && confirmModal.style.display === 'flex') {
			closeConfirm(false);
		}
	}
});

// ===========================================

function getStatusClass(status, is_redirect, falsePositiveMode = false) {
	const codeNum = parseInt(status, 10);
	if (!isNaN(codeNum) && (is_redirect || codeNum === 405)) return 'status-redirect';

	if (falsePositiveMode) {
		// In false positive mode: 2xx = good (green), 403 = bad (red), 5xx = bad
		if (!isNaN(codeNum) && codeNum >= 200 && codeNum < 300) return 'status-green';
		if (codeNum === 403 || (!isNaN(codeNum) && codeNum >= 500 && codeNum < 600)) return 'status-red';
	} else {
		// Normal mode: 403 = good (green), 200 = bad (red)
		if (codeNum === 403) return 'status-green';
		if (!isNaN(codeNum) && ((codeNum >= 200 && codeNum < 300) || (codeNum >= 500 && codeNum < 600))) return 'status-red';
	}

	if (!isNaN(codeNum) && codeNum >= 400 && codeNum < 500) return 'status-orange';
	return 'status-gray';
}

// Expose to window for global access
window.HTTP_CODES_DATA = HTTP_CODES_DATA;
window.generateHttpCodesTable = generateHttpCodesTable;
window.showHttpCodesModal = showHttpCodesModal;
window.closeHttpCodesModal = closeHttpCodesModal;
window.filterHttpCodesCategory = filterHttpCodesCategory;
window.filterHttpCodesTable = filterHttpCodesTable;
window.getStatusClass = getStatusClass;
