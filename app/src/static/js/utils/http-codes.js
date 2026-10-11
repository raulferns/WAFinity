/**
 * WAF-Checker - HTTP Status Codes Modal & Helpers
 */

// ===========================================
// HTTP STATUS CODES MODAL
// ===========================================

function generateHttpCodesTable(context = 'normal') {
	const codes = [
		{
			code: '200',
			name: 'OK',
			normal: 'Request succeeded - <strong class="text-cyber-danger">VULNERABLE</strong> (attack passed)',
			falsePositive: '<strong class="text-cyber-success">GOOD</strong> - Legitimate request allowed',
			httpManip: '<strong class="text-cyber-danger">BYPASS</strong> - Manipulation succeeded, WAF did not block',
			bg: 'bg-cyber-danger/5',
		},
		{
			code: '201',
			name: 'Created',
			normal: 'Resource created - <strong class="text-cyber-danger">VULNERABLE</strong>',
			falsePositive: '<strong class="text-cyber-success">GOOD</strong> - Resource created successfully',
			httpManip: 'Resource created - <strong class="text-cyber-danger">BYPASS</strong>',
			bg: 'bg-cyber-danger/5',
		},
		{
			code: '204',
			name: 'No Content',
			normal: 'Success with no content - <strong class="text-cyber-danger">VULNERABLE</strong>',
			falsePositive: '<strong class="text-cyber-success">GOOD</strong> - Request processed successfully',
			httpManip: 'Success with no content - <strong class="text-cyber-danger">BYPASS</strong>',
			bg: 'bg-cyber-danger/5',
		},
		{
			code: '301',
			name: 'Moved Permanently',
			normal: 'Permanent redirect - Check if WAF block page or normal redirect',
			falsePositive: 'Permanent redirect - Check if legitimate or WAF block',
			httpManip: 'Permanent redirect - Check if WAF block page or normal redirect',
			bg: 'bg-orange-500/5',
		},
		{
			code: '302',
			name: 'Found',
			normal: 'Temporary redirect - Check Location header for block page',
			falsePositive: 'Temporary redirect - Investigate if unnecessary',
			httpManip: 'Temporary redirect - May indicate WAF redirecting to block page',
			bg: 'bg-orange-500/5',
		},
		{
			code: '307',
			name: 'Temporary Redirect',
			normal: 'Temporary redirect (method preserved) - Investigate',
			falsePositive: 'Temporary redirect - May be normal or WAF-related',
			httpManip: 'Temporary redirect (method preserved) - Investigate',
			bg: 'bg-orange-500/5',
		},
		{
			code: '308',
			name: 'Permanent Redirect',
			normal: 'Permanent redirect (method preserved) - Investigate',
			falsePositive: 'Permanent redirect - Investigate',
			httpManip: 'Permanent redirect (method preserved) - Investigate',
			bg: 'bg-orange-500/5',
		},
		{
			code: '403',
			name: 'Forbidden',
			normal: '<strong class="text-cyber-success">PROTECTED</strong> - WAF blocked the attack',
			falsePositive: '<strong class="text-cyber-danger">FALSE POSITIVE</strong> - Legitimate request blocked',
			httpManip: '<strong class="text-cyber-success">PROTECTED</strong> - WAF detected and blocked the manipulation',
			bg: 'bg-cyber-success/5',
		},
		{
			code: '404',
			name: 'Not Found',
			normal: 'Resource not found - May indicate WAF blocking or normal 404',
			falsePositive: 'Resource not found - May be normal or WAF blocking',
			httpManip: 'Resource not found - May indicate WAF blocking',
			bg: 'bg-orange-500/5',
		},
		{
			code: '405',
			name: 'Method Not Allowed',
			normal: 'HTTP method not allowed - May indicate protection',
			falsePositive: 'HTTP method not allowed - May indicate over-protection',
			httpManip: 'HTTP method not allowed - May indicate protection',
			bg: 'bg-orange-500/5',
		},
		{
			code: '406',
			name: 'Not Acceptable',
			normal: 'Server cannot produce acceptable response - Often WAF-related',
			falsePositive: 'Server cannot produce acceptable response - Often WAF-related',
			httpManip: 'Server cannot produce acceptable response - Often WAF-related',
			bg: 'bg-orange-500/5',
		},
		{
			code: '429',
			name: 'Too Many Requests',
			normal: 'Rate limiting - WAF may be throttling requests',
			falsePositive: 'Rate limiting - May be too aggressive for legitimate traffic',
			httpManip: 'Rate limiting - WAF may be throttling manipulation attempts',
			bg: 'bg-orange-500/5',
		},
		{
			code: '500',
			name: 'Internal Server Error',
			normal: 'Server error - May indicate WAF blocking or application error',
			falsePositive: 'Server error - May indicate WAF blocking or application issue',
			httpManip: 'Server error - May indicate WAF blocking or application error',
			bg: 'bg-orange-500/5',
		},
		{
			code: '502',
			name: 'Bad Gateway',
			normal: 'Gateway error - Network or WAF infrastructure issue',
			falsePositive: 'Gateway error - Network or infrastructure issue',
			httpManip: 'Gateway error - Network or infrastructure issue',
			bg: 'bg-orange-500/5',
		},
		{
			code: '503',
			name: 'Service Unavailable',
			normal: 'Service unavailable - May indicate WAF blocking or maintenance',
			falsePositive: 'Service unavailable - May indicate WAF blocking or maintenance',
			httpManip: 'Service unavailable - May indicate WAF blocking or maintenance',
			bg: 'bg-orange-500/5',
		},
		{
			code: 'ERR',
			name: 'Error',
			normal: 'Network/connection error - Request failed to complete',
			falsePositive: 'Network/connection error - Request failed to complete',
			httpManip: 'Network/connection error - Request failed to complete',
			bg: 'bg-orange-500/5',
		},
	];

	const contextLabels = {
		normal: 'WAF Context',
		falsePositive: 'False Positive Context',
		httpManip: 'HTTP Manipulation Context',
	};

	let html = `<table class="w-full text-xs border-collapse">
		<thead>
			<tr class="bg-cyber-elevated/50">
				<th class="px-3 py-2 text-left border border-cyber-accent/20 text-gray-300 font-bold">Code</th>
				<th class="px-3 py-2 text-left border border-cyber-accent/20 text-gray-300 font-bold">Name</th>
				<th class="px-3 py-2 text-left border border-cyber-accent/20 text-gray-300 font-bold">Meaning (${contextLabels[context] || contextLabels.normal})</th>
			</tr>
		</thead>
		<tbody class="text-gray-400">`;

	codes.forEach((item) => {
		const meaning = item[context] || item.normal;
		const codeColor =
			item.code === '403'
				? 'text-cyber-success'
				: item.code === '200' || item.code === '201' || item.code === '204'
					? 'text-cyber-danger'
					: 'text-orange-400';

		html += `<tr class="${item.bg}">
			<td class="px-3 py-2 border border-cyber-accent/20 font-mono font-bold ${codeColor}">${item.code}</td>
			<td class="px-3 py-2 border border-cyber-accent/20">${item.name}</td>
			<td class="px-3 py-2 border border-cyber-accent/20">${meaning}</td>
		</tr>`;
	});

	html += `</tbody></table>`;
	return html;
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
	contentEl.innerHTML = generateHttpCodesTable(context);

	modal.style.display = 'flex';
	document.body.style.overflow = 'hidden';
}

function closeHttpCodesModal() {
	const modal = document.getElementById('httpCodesModal');
	modal.style.display = 'none';
	document.body.style.overflow = '';
}

// Handle Escape key for modals
document.addEventListener('keydown', (e) => {
	if (e.key === 'Escape') {
		const alertModal = document.getElementById('customAlertModal');
		const confirmModal = document.getElementById('customConfirmModal');

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
window.generateHttpCodesTable = generateHttpCodesTable;
window.showHttpCodesModal = showHttpCodesModal;
window.closeHttpCodesModal = closeHttpCodesModal;
window.getStatusClass = getStatusClass;
