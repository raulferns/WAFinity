/**
 * WAF-Checker - WAF Detection & HTTP Manipulation Module
 */

async function detectWAF() {
	// Close mobile drawer if open
	closeMobileDrawer();

	const btn = document.getElementById('detectWafBtn');
	const urlInput = document.getElementById('url');
	const url = normalizeUrl(urlInput.value);

	// Update the input field with normalized URL if it was changed
	if (url !== urlInput.value) {
		urlInput.value = url;
	}

	if (!url) {
		showAlert('Please enter a URL first', 'Missing URL', 'warning');
		return;
	}

	btn.disabled = true;
	const oldText = btn.textContent;
	btn.textContent = 'Detecting...';

	try {
		const response = await fetch(`/api/waf-detect?url=${encodeURIComponent(url)}`);
		const data = await response.json();

		if (response.ok) {
			displayWAFDetectionResults(data);
			showWAFPanel(data);
		} else {
			showAlert(`WAF Detection failed: ${data.error || 'Unknown error'}`, 'Error', 'error');
		}
	} catch (error) {
		console.error('WAF Detection error:', error);
		showAlert('WAF Detection failed. Please check the console for details.', 'Error', 'error');
	} finally {
		btn.disabled = false;
		btn.textContent = oldText;
	}
}

function displayWAFDetectionResults(data) {
	const resultsDiv = document.getElementById('results');
	const det = data.detection || {};
	const isBlocking = det.isActivelyBlocking === true;
	const isDefaultSecurity = det.hasDefaultSecurity === true;
	const infraName = det.infrastructure || null;

	let html = `<div class="bg-cyber-card border border-cyber-accent/30 rounded-xl overflow-hidden mb-4">
		<div class="flex items-center gap-3 p-4 border-b border-cyber-accent/20 bg-cyber-accent/10">
			<div class="w-10 h-10 rounded-lg bg-cyber-accent/20 flex items-center justify-center">
				<svg class="w-5 h-5 text-cyber-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
				</svg>
			</div>
			<div>
				<h3 class="text-sm font-bold text-cyber-accent">WAF Detection Results</h3>
				<p class="text-xs text-gray-400">Three-phase detection: passive + active + evasion confirmation</p>
			</div>
		</div>

		<div class="p-4">
			<!-- Explanation Section -->
			<div class="mb-4 p-3 bg-cyber-accent/5 border border-cyber-accent/20 rounded-lg">
				<p class="text-xs text-gray-300 leading-relaxed mb-2">
					<strong class="text-cyber-accent">How does detection work?</strong> Three phases are used to avoid false positives:
				</p>
				<ul class="text-xs text-gray-400 space-y-1 ml-4 list-disc">
					<li><strong class="text-white">Phase 1 — Passive</strong>: A clean request identifies the CDN/infrastructure via response headers</li>
					<li><strong class="text-white">Phase 2 — Active</strong>: Obvious attack payloads (SQLi, XSS, LFI) are sent and responses compared against the baseline</li>
					<li><strong class="text-white">Phase 3 — Evasion</strong>: If probes are blocked, obfuscated payloads (comment injection, alternative syntax) are sent to distinguish default CDN security from active WAF rules</li>
				</ul>
				<p class="text-xs text-gray-400 mt-2 italic">
					A WAF is confirmed as "actively configured" only when evasion probes are also blocked, indicating custom rules beyond default CDN protection.
				</p>
			</div>`;

	// Baseline vs Probe status indicator
	if (det.baselineStatus !== undefined) {
		const baseStatus = det.baselineStatus;
		const prbStatus = det.probeStatus !== undefined ? det.probeStatus : baseStatus;
		const statusChanged = baseStatus !== prbStatus;

		html += `<div class="mb-4 p-3 bg-cyber-bg/50 border border-gray-600/30 rounded-lg">
			<p class="text-xs font-bold text-gray-300 mb-2">Request Comparison</p>
			<div class="flex items-center gap-3 flex-wrap">
				<div class="flex items-center gap-2">
					<span class="text-xs text-gray-400">Clean request:</span>
					<span class="px-2 py-0.5 rounded text-xs font-mono font-bold ${baseStatus < 400 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}">${baseStatus}</span>
				</div>
				<svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
				<div class="flex items-center gap-2">
					<span class="text-xs text-gray-400">With payload:</span>
					<span class="px-2 py-0.5 rounded text-xs font-mono font-bold ${prbStatus < 400 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}">${prbStatus}</span>
				</div>
				${
					statusChanged
						? '<span class="ml-2 px-2 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">BLOCKED</span>'
						: '<span class="ml-2 px-2 py-0.5 rounded text-xs font-bold bg-gray-500/20 text-gray-400 border border-gray-500/30">NOT BLOCKED</span>'
				}
			</div>
		</div>`;
	}

	// Detection results — 4 possible states:
	// 1. isBlocking: WAF with active rules (evasion probes also blocked) → RED
	// 2. isDefaultSecurity: CDN default security only (evasion probes passed) → ORANGE
	// 3. detected but not blocking: CDN present, nothing blocked → CYAN
	// 4. not detected: no signatures found → GREEN
	if (det.detected) {
		if (isBlocking) {
			// Case 1: Active WAF rules confirmed — RED alert
			html += `<div class="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
				<div class="flex items-center gap-3 mb-2">
					<svg class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
					</svg>
					<div>
						<h4 class="text-sm font-bold text-red-400">WAF Actively Blocking: ${escapeHtml(det.wafType)}</h4>
						<p class="text-xs text-gray-400">Confidence: <strong class="text-white">${det.confidence}%</strong> — Active WAF rules confirmed (evasion probes also blocked)</p>
					</div>
				</div>`;

			if (infraName && infraName !== det.wafType) {
				html += `<p class="text-xs text-gray-400 mb-2">Infrastructure: <strong class="text-cyber-accent">${escapeHtml(infraName)}</strong> (CDN), blocking WAF: <strong class="text-red-400">${escapeHtml(det.wafType)}</strong></p>`;
			}
		} else if (isDefaultSecurity) {
			// Case 2: CDN default security only — ORANGE/YELLOW alert
			html += `<div class="mb-4 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
				<div class="flex items-center gap-3 mb-2">
					<svg class="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
					</svg>
					<div>
						<h4 class="text-sm font-bold text-orange-400">CDN Default Security: ${escapeHtml(det.wafType)}</h4>
						<p class="text-xs text-gray-400">Confidence: <strong class="text-white">${det.confidence}%</strong> — <strong class="text-orange-400">No active WAF rules</strong></p>
					</div>
				</div>
				<p class="text-xs text-gray-400 mb-2">The target uses <strong class="text-orange-400">${escapeHtml(det.wafType)}</strong> as CDN/proxy. Obvious attack payloads are blocked by <strong>standard CDN protection</strong>, but evasion techniques pass through.</p>
				<p class="text-xs text-gray-400 italic">This indicates default security settings — no custom WAF rules are configured. This is normal behavior for most CDN providers.</p>`;
		} else {
			// Case 3: CDN/infra detected but NOT blocking at all — ORANGE/info
			html += `<div class="mb-4 p-4 bg-cyber-accent/10 border border-cyber-accent/30 rounded-lg">
				<div class="flex items-center gap-3 mb-2">
					<svg class="w-6 h-6 text-cyber-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
					</svg>
					<div>
						<h4 class="text-sm font-bold text-cyber-accent">CDN/Infrastructure Detected: ${escapeHtml(det.wafType)}</h4>
						<p class="text-xs text-gray-400">Confidence: <strong class="text-white">${det.confidence}%</strong> — <strong class="text-green-400">Probes were NOT blocked</strong></p>
					</div>
				</div>
				<p class="text-xs text-gray-400">The target uses <strong class="text-cyber-accent">${escapeHtml(det.wafType)}</strong> as CDN/proxy, but neither basic nor advanced attack payloads are blocked.</p>`;
		}

		if (det.evidence && det.evidence.length > 0) {
			html += `<div class="mt-3">
				<p class="text-xs font-bold text-gray-300 mb-2">Evidence:</p>
				<ul class="space-y-1">`;
			det.evidence.forEach((evidence) => {
				const isInfra =
					evidence.includes('infrastructure') ||
					evidence.includes('clean response') ||
					evidence.includes('default') ||
					evidence.includes('CDN');
				const isEvasion = evidence.includes('vasion') || evidence.includes('passed through');
				let codeClass = 'bg-cyber-bg/50 text-gray-300';
				if (isEvasion) codeClass = 'bg-orange-900/30 text-orange-300';
				else if (isInfra) codeClass = 'bg-cyber-accent/15 text-cyber-accent';
				html += `<li class="text-xs text-gray-400"><code class="${codeClass} px-2 py-0.5 rounded">${escapeHtml(evidence)}</code></li>`;
			});
			html += `</ul></div>`;
		}

		if (isBlocking && det.suggestedBypassTechniques && det.suggestedBypassTechniques.length > 0) {
			html += `<div class="mt-3">
				<p class="text-xs font-bold text-cyber-warning mb-2">Suggested Bypass Techniques:</p>
				<ul class="space-y-1">`;
			det.suggestedBypassTechniques.forEach((technique) => {
				html += `<li class="text-xs text-gray-400">&bull; ${escapeHtml(technique)}</li>`;
			});
			html += `</ul></div>`;
		}

		html += `</div>`;
	} else {
		// Case 4: Nothing detected
		html += `<div class="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
			<div class="flex items-center gap-3">
				<svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
				</svg>
				<div>
					<p class="text-sm font-bold text-green-400">No WAF detected</p>
					<p class="text-xs text-gray-400">No WAF/CDN signatures found and probes were not blocked</p>
				</div>
			</div>
		</div>`;
	}

	// Bypass opportunities
	if (data.bypassOpportunities) {
		html += `<div class="mb-4">
			<p class="text-xs font-bold text-gray-300 mb-3">Bypass Opportunities:</p>
			<div class="grid grid-cols-2 gap-2">`;

		const opportunities = [
			{ key: 'httpMethodsBypass', label: 'HTTP Method Bypass', icon: '🔀' },
			{ key: 'headerBypass', label: 'Header Bypass', icon: '📋' },
			{ key: 'encodingBypass', label: 'Encoding Bypass', icon: '🔤' },
			{ key: 'parameterPollution', label: 'Parameter Pollution', icon: '🔁' },
		];

		opportunities.forEach((opp) => {
			const status = data.bypassOpportunities[opp.key];
			const bgClass = status ? 'bg-cyber-warning/20 border-cyber-warning/30' : 'bg-gray-500/10 border-gray-500/20';
			const textClass = status ? 'text-cyber-warning' : 'text-gray-500';
			const statusText = status ? 'Possible' : 'Not detected';

			html += `<div class="p-2 border rounded-lg ${bgClass}">
				<div class="flex items-center gap-2">
					<span class="text-xs">${opp.icon}</span>
					<span class="text-xs font-bold ${textClass}">${opp.label}</span>
				</div>
				<p class="text-xs text-gray-400 mt-1">${statusText}</p>
			</div>`;
		});

		html += `</div></div>`;
	}

	html += `</div></div>`;
	resultsDiv.innerHTML = html;
	// Hide export controls (not relevant for WAF detection)
	const exportControls = document.getElementById('exportControls');
	if (exportControls) exportControls.style.display = 'none';
}

function showWAFPanel(data) {
	const panel = document.getElementById('wafDetectionPanel');
	const resultsDiv = document.getElementById('wafDetectionResults');

	if (!panel || !resultsDiv) return;

	let html = '';
	const det = data.detection;

	if (det && det.detected) {
		if (det.isActivelyBlocking) {
			// Active WAF — red badge
			html = `<div class="d-flex align-items-center justify-content-between">
				<div>
					<strong>${det.wafType}</strong> detected
					<span class="badge bg-danger ms-2">${det.confidence}% confidence</span>
					<span class="badge bg-danger ms-1">WAF Active</span>
				</div>
			</div>`;
			window.detectedWAF = det.wafType;

			// Auto-enable advanced payloads if active WAF detected
			const advancedCheckbox = document.getElementById('useAdvancedPayloadsCheckbox');
			if (advancedCheckbox) {
				advancedCheckbox.checked = true;
			}
		} else if (det.hasDefaultSecurity) {
			// Default CDN security — orange badge
			html = `<div class="d-flex align-items-center justify-content-between">
				<div>
					<strong>${det.wafType}</strong> detected
					<span class="badge bg-warning text-dark ms-2">${det.confidence}% confidence</span>
					<span class="badge bg-warning text-dark ms-1">Default Security</span>
				</div>
			</div>`;
			window.detectedWAF = null; // Not a real WAF
		} else {
			// CDN detected, not blocking — info badge
			html = `<div class="d-flex align-items-center justify-content-between">
				<div>
					<strong>${det.wafType}</strong> detected
					<span class="badge bg-info ms-2">${det.confidence}% confidence</span>
					<span class="badge bg-info ms-1">CDN Only</span>
				</div>
			</div>`;
			window.detectedWAF = null;
		}
	} else {
		html = '<div>No WAF detected with high confidence</div>';
		window.detectedWAF = null;
	}

	resultsDiv.innerHTML = html;
	panel.style.display = 'block';
}

function hideWAFPanel() {
	const panel = document.getElementById('wafDetectionPanel');
	if (panel) {
		panel.style.display = 'none';
	}
}

function useAdvancedPayloads() {
	const checkbox = document.getElementById('useAdvancedPayloadsCheckbox');
	const encodingCheckbox = document.getElementById('useEncodingVariations');

	if (checkbox) checkbox.checked = true;
	if (encodingCheckbox) encodingCheckbox.checked = true;

	showAlert('Advanced payloads enabled! Run the test to see WAF-specific bypass techniques.', 'Success', 'success');
}

function clearWAFResults() {
	const resultsDiv = document.getElementById('results');
	const wafCards = resultsDiv.querySelectorAll('.card:has(.card-header h3:contains("WAF Detection"))');
	wafCards.forEach((card) => card.remove());

	hideWAFPanel();
	window.detectedWAF = null;
}

// HTTP Manipulation Testing
async function testHTTPManipulation() {
	// Close mobile drawer if open
	closeMobileDrawer();

	const btn = document.getElementById('httpManipulationBtn');
	const urlInput = document.getElementById('url');
	const url = normalizeUrl(urlInput.value);

	// Update the input field with normalized URL if it was changed
	if (url !== urlInput.value) {
		urlInput.value = url;
	}

	if (!url) {
		showAlert('Please enter a URL first', 'Missing URL', 'warning');
		return;
	}

	btn.disabled = true;
	const oldText = btn.textContent;
	btn.textContent = 'Testing...';

	try {
		const response = await fetch(`/api/http-manipulation?url=${encodeURIComponent(url)}`);
		const data = await response.json();

		if (response.ok) {
			displayHTTPManipulationResults(data);
		} else {
			showAlert(`HTTP Manipulation test failed: ${data.error || 'Unknown error'}`, 'Error', 'error');
		}
	} catch (error) {
		console.error('HTTP Manipulation test error:', error);
		showAlert('HTTP Manipulation test failed. Please check the console for details.', 'Error', 'error');
	} finally {
		btn.disabled = false;
		btn.textContent = oldText;
	}
}

function displayHTTPManipulationResults(data) {
	const resultsDiv = document.getElementById('results');

	let html = `<div class="flex items-center justify-between mb-4 p-4 bg-cyber-card border border-white/[0.08] rounded-2xl shadow-none flex-wrap gap-3">
		<div class="flex items-center gap-3">
			<div class="w-10 h-10 rounded-xl bg-cyber-elevated border border-white/[0.08] flex items-center justify-center text-slate-300">
				<svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
				</svg>
			</div>
			<div>
				<h3 class="text-sm font-bold text-white tracking-tight">HTTP Manipulation Test</h3>
				<p class="text-xs text-slate-400">Testing WAF bypass via protocol manipulation</p>
			</div>
		</div>
		<div class="flex items-center gap-2 flex-wrap text-xs">
			<span class="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#181923] border border-white/[0.08] rounded-[10px] text-xs font-medium text-slate-300">
				<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
				<span>403 = Protected</span>
			</span>
			<span class="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#181923] border border-white/[0.08] rounded-[10px] text-xs font-medium text-slate-300">
				<span class="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0"></span>
				<span>200 = Bypass</span>
			</span>
			<button onclick="showHttpCodesModal('httpManip')" class="px-3 py-1.5 bg-[#181923] hover:bg-[#20212d] border border-white/[0.08] hover:border-white/[0.18] rounded-[10px] text-slate-300 hover:text-white text-xs font-semibold transition-all shadow-none">
				Show all HTTP codes
			</button>
		</div>
	</div>
	<div class="mb-4 p-3.5 bg-[#13141c] border border-white/[0.08] rounded-xl">
		<p class="text-xs text-slate-400 leading-relaxed mb-0">
			<strong class="text-slate-200 font-semibold">What is HTTP Manipulation?</strong> This test checks if your WAF can be <strong class="text-rose-400">bypassed</strong> by manipulating the HTTP protocol instead of using malicious payloads.
			It tests techniques like <strong class="text-slate-200">HTTP Verb Tampering</strong> (using non-standard methods like PATCH, TRACE), <strong class="text-slate-200">Parameter Pollution</strong> (sending duplicate parameters), and <strong class="text-slate-200">Content-Type Confusion</strong>.
			<strong class="text-emerald-400">Status 403 (green)</strong> means the WAF blocked the manipulation.
			<strong class="text-rose-400">Status 200 (red)</strong> means the request succeeded - the WAF can be <strong class="text-rose-400">bypassed</strong> with this technique.
		</p>
	</div>

	<div class="bg-cyber-card border border-white/[0.08] rounded-2xl overflow-hidden shadow-none mb-4">`;

	if (data.results && data.results.length > 0) {
		html += `<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead>
					<tr class="bg-[#13141c] border-b border-white/[0.08]">
						<th class="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Technique</th>
						<th class="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Method</th>
						<th class="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
						<th class="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Result</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-white/[0.04]">`;

		data.results.forEach((result) => {
			const statusStr = String(result.status);
			const isError = statusStr === 'ERR' || statusStr === 'error' || statusStr === 'Error';
			const codeNum = isError ? NaN : parseInt(statusStr, 10);
			let statusBg = 'bg-slate-500/10 border border-slate-500/25 text-slate-300';

			if (isError || isNaN(codeNum)) {
				statusBg = 'bg-amber-500/10 border border-amber-500/25 text-amber-400';
			} else if (codeNum >= 200 && codeNum < 300) {
				statusBg = 'bg-rose-500/10 border border-rose-500/25 text-rose-400';
			} else if (codeNum === 403) {
				statusBg = 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400';
			} else if (codeNum >= 300 && codeNum < 400) {
				statusBg = 'bg-amber-500/10 border border-amber-500/25 text-amber-400';
			} else if (codeNum >= 400 && codeNum < 500 && codeNum !== 403) {
				statusBg = 'bg-amber-500/10 border border-amber-500/25 text-amber-400';
			}

			let resultText;
			let resultBg;

			if (!isError && !isNaN(codeNum)) {
				if (codeNum >= 200 && codeNum < 300) {
					resultText = 'Potential Bypass';
					resultBg = 'bg-rose-500/10 border border-rose-500/25 text-rose-400';
				} else if (codeNum === 403) {
					resultText = 'Blocked';
					resultBg = 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400';
				} else if (codeNum >= 300 && codeNum < 400) {
					resultText = 'Redirect';
					resultBg = 'bg-amber-500/10 border border-amber-500/25 text-amber-400';
				} else if (codeNum >= 400 && codeNum < 500) {
					resultText = 'Error';
					resultBg = 'bg-amber-500/10 border border-amber-500/25 text-amber-400';
				} else {
					resultText = 'Unknown';
					resultBg = 'bg-slate-500/10 border border-slate-500/25 text-slate-300';
				}
			} else {
				resultText = 'Error';
				resultBg = 'bg-amber-500/10 border border-amber-500/25 text-amber-400';
			}

			const methodDisplay = result.method && result.method !== 'undefined' ? result.method : result.technique || 'N/A';
			html += `<tr class="hover:bg-white/[0.02] transition-colors border-b border-white/[0.04]">
				<td class="px-4 py-2.5 text-xs text-slate-300 font-medium">${escapeHtml(result.testType || result.technique || 'Unknown')}</td>
				<td class="px-4 py-2.5 text-center">
					<span class="px-2 py-0.5 bg-[#181923] border border-white/[0.08] text-slate-300 text-xs font-mono rounded font-medium">${escapeHtml(methodDisplay)}</span>
				</td>
				<td class="px-4 py-2.5 text-center">
					<span class="px-2.5 py-0.5 ${statusBg} text-xs font-mono font-semibold rounded-md cursor-pointer hover:brightness-110 transition-all inline-block" onclick="showHttpCodesModal('httpManip')">${result.status}</span>
				</td>
				<td class="px-4 py-2.5 text-center">
					<span class="px-2.5 py-0.5 ${resultBg} text-xs font-mono font-semibold rounded-md inline-block">${resultText}</span>
				</td>
			</tr>`;
		});

		html += '</tbody></table></div>';
	} else {
		html += `<div class="p-4 text-center text-slate-400 text-sm">No HTTP manipulation tests performed.</div>`;
	}

	html += '</div>';
	resultsDiv.innerHTML = html;
	// Hide export controls (not relevant for HTTP manipulation)
	const exportControls = document.getElementById('exportControls');
	if (exportControls) exportControls.style.display = 'none';
}

// HTTP Manipulation Testing functionality
async function testHTTPManipulation() {
	// Close mobile drawer if open
	closeMobileDrawer();

	const btn = document.getElementById('httpManipulationBtn');
	const url = normalizeUrl(document.getElementById('url').value);

	if (!url) {
		showAlert('Please enter a URL first', 'Missing URL', 'warning');
		return;
	}

	btn.disabled = true;
	const oldText = btn.textContent;
	btn.textContent = 'Testing...';

	try {
		const response = await fetch(`/api/http-manipulation?url=${encodeURIComponent(url)}`);
		const data = await response.json();

		if (response.ok) {
			displayHTTPManipulationResults(data);
		} else {
			showAlert(`HTTP Manipulation test failed: ${data.error || 'Unknown error'}`, 'Error', 'error');
		}
	} catch (error) {
		console.error('HTTP Manipulation test error:', error);
		showAlert('HTTP Manipulation test failed. Please check the console for details.', 'Error', 'error');
	} finally {
		btn.disabled = false;
		btn.textContent = oldText;
	}
}

// Toggle all categories - switches between all selected and none selected

// Expose to window for global access
window.detectWAF = detectWAF;
window.displayWAFDetectionResults = displayWAFDetectionResults;
window.showWAFPanel = showWAFPanel;
window.hideWAFPanel = hideWAFPanel;
window.useAdvancedPayloads = useAdvancedPayloads;
window.clearWAFResults = clearWAFResults;
window.testHTTPManipulation = testHTTPManipulation;
window.displayHTTPManipulationResults = displayHTTPManipulationResults;
