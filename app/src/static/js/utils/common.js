/**
 * WAF-Checker - Common Utilities
 */

var SLOW_RESPONSE_THRESHOLD = 2000;
window.SLOW_RESPONSE_THRESHOLD = SLOW_RESPONSE_THRESHOLD;

function escapeAttr(str) {
	if (str === null || str === undefined) return '';
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/\r/g, '&#13;')
		.replace(/\n/g, '&#10;');
}
window.escapeAttr = escapeAttr;

function escapeHtml(str) {
	const div = document.createElement('div');
	div.textContent = str;
	return div.innerHTML;
}

// ===========================================
// UNIFIED CYBER LOADER (Lottie Animation)
// ===========================================

var CYBER_LOADER_LOTTIE_DATA = {"v":"5.5.10","fr":29.9700012207031,"ip":0,"op":60.0000024438501,"w":124,"h":124,"nm":"loader","ddd":0,"assets":[],"layers":[{"ddd":0,"ind":1,"ty":4,"nm":"Shape Layer 2","sr":1,"ks":{"o":{"a":0,"k":100,"ix":11},"r":{"a":1,"k":[{"i":{"x":[0.833],"y":[0.833]},"o":{"x":[0.167],"y":[0.167]},"t":0,"s":[0]},{"t":60.0000024438501,"s":[360]}],"ix":10},"p":{"a":0,"k":[62,62,0],"ix":2},"a":{"a":0,"k":[0.576,4.576,0],"ix":1},"s":{"a":0,"k":[100,100,100],"ix":6}},"ao":0,"shapes":[{"ty":"gr","it":[{"d":1,"ty":"el","s":{"a":0,"k":[89.152,89.152],"ix":2},"p":{"a":0,"k":[0,0],"ix":3},"nm":"Ellipse Path 1","mn":"ADBE Vector Shape - Ellipse","hd":false},{"ty":"tm","s":{"a":1,"k":[{"i":{"x":[0.667],"y":[1]},"o":{"x":[0.333],"y":[0]},"t":0,"s":[50.1]},{"i":{"x":[0.667],"y":[1]},"o":{"x":[0.333],"y":[0]},"t":30.338,"s":[70.1]},{"t":60.0000024438501,"s":[50.1]}],"ix":1},"e":{"a":1,"k":[{"i":{"x":[0.667],"y":[1]},"o":{"x":[0.333],"y":[0]},"t":0,"s":[49.9]},{"i":{"x":[0.667],"y":[1]},"o":{"x":[0.333],"y":[0]},"t":30.338,"s":[29.9]},{"t":60.0000024438501,"s":[49.9]}],"ix":2},"o":{"a":1,"k":[{"i":{"x":[0.833],"y":[0.833]},"o":{"x":[0.167],"y":[0.167]},"t":0,"s":[0]},{"t":60.0000024438501,"s":[360]}],"ix":3},"m":1,"ix":2,"nm":"Trim Paths 1","mn":"ADBE Vector Filter - Trim","hd":false},{"ty":"st","c":{"a":0,"k":[0.9412,0.3373,0.1529,1],"ix":3},"o":{"a":0,"k":100,"ix":4},"w":{"a":0,"k":25,"ix":5},"lc":2,"lj":2,"bm":0,"nm":"Stroke 1","mn":"ADBE Vector Graphic - Stroke","hd":false},{"ty":"tr","p":{"a":0,"k":[0.576,4.576],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Ellipse 1","np":4,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false}],"ip":0,"op":90.0000036657751,"st":0,"bm":0},{"ddd":0,"ind":2,"ty":4,"nm":"Shape Layer 3","sr":1,"ks":{"o":{"a":0,"k":35,"ix":11},"r":{"a":1,"k":[{"i":{"x":[0.833],"y":[0.833]},"o":{"x":[0.167],"y":[0.167]},"t":0,"s":[0]},{"t":60.0000024438501,"s":[360]}],"ix":10},"p":{"a":0,"k":[62,62,0],"ix":2},"a":{"a":0,"k":[0.576,4.576,0],"ix":1},"s":{"a":0,"k":[100,100,100],"ix":6}},"ao":0,"shapes":[{"ty":"gr","it":[{"d":1,"ty":"el","s":{"a":0,"k":[89.152,89.152],"ix":2},"p":{"a":0,"k":[0,0],"ix":3},"nm":"Ellipse Path 1","mn":"ADBE Vector Shape - Ellipse","hd":false},{"ty":"tm","s":{"a":1,"k":[{"i":{"x":[0.667],"y":[1]},"o":{"x":[0.333],"y":[0]},"t":0,"s":[50.1]},{"i":{"x":[0.667],"y":[1]},"o":{"x":[0.333],"y":[0]},"t":30.338,"s":[70.1]},{"t":60.0000024438501,"s":[50.1]}],"ix":1},"e":{"a":1,"k":[{"i":{"x":[0.667],"y":[1]},"o":{"x":[0.333],"y":[0]},"t":0,"s":[49.9]},{"i":{"x":[0.667],"y":[1]},"o":{"x":[0.333],"y":[0]},"t":30.338,"s":[19.9]},{"t":60.0000024438501,"s":[49.9]}],"ix":2},"o":{"a":1,"k":[{"i":{"x":[0.833],"y":[0.833]},"o":{"x":[0.167],"y":[0.167]},"t":0,"s":[0]},{"t":60.0000024438501,"s":[360]}],"ix":3},"m":1,"ix":2,"nm":"Trim Paths 1","mn":"ADBE Vector Filter - Trim","hd":false},{"ty":"st","c":{"a":0,"k":[0.9412,0.3373,0.1529,1],"ix":3},"o":{"a":0,"k":100,"ix":4},"w":{"a":0,"k":25,"ix":5},"lc":2,"lj":2,"bm":0,"nm":"Stroke 1","mn":"ADBE Vector Graphic - Stroke","hd":false},{"ty":"tr","p":{"a":0,"k":[0.576,4.576],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Ellipse 1","np":4,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false}],"ip":0,"op":90.0000036657751,"st":0,"bm":0},{"ddd":0,"ind":3,"ty":4,"nm":"Shape Layer 4","sr":1,"ks":{"o":{"a":0,"k":35,"ix":11},"r":{"a":1,"k":[{"i":{"x":[0.833],"y":[0.833]},"o":{"x":[0.167],"y":[0.167]},"t":0,"s":[0]},{"t":60.0000024438501,"s":[360]}],"ix":10},"p":{"a":0,"k":[62,62,0],"ix":2},"a":{"a":0,"k":[0.576,4.576,0],"ix":1},"s":{"a":0,"k":[100,100,100],"ix":6}},"ao":0,"shapes":[{"ty":"gr","it":[{"d":1,"ty":"el","s":{"a":0,"k":[89.152,89.152],"ix":2},"p":{"a":0,"k":[0,0],"ix":3},"nm":"Ellipse Path 1","mn":"ADBE Vector Shape - Ellipse","hd":false},{"ty":"tm","s":{"a":1,"k":[{"i":{"x":[0.667],"y":[1]},"o":{"x":[0.333],"y":[0]},"t":0,"s":[50.1]},{"i":{"x":[0.667],"y":[1]},"o":{"x":[0.333],"y":[0]},"t":30.338,"s":[70.1]},{"t":60.0000024438501,"s":[50.1]}],"ix":1},"e":{"a":1,"k":[{"i":{"x":[0.667],"y":[1]},"o":{"x":[0.333],"y":[0]},"t":0,"s":[49.9]},{"i":{"x":[0.667],"y":[1]},"o":{"x":[0.333],"y":[0]},"t":30.338,"s":[9.9]},{"t":60.0000024438501,"s":[49.9]}],"ix":2},"o":{"a":1,"k":[{"i":{"x":[0.833],"y":[0.833]},"o":{"x":[0.167],"y":[0.167]},"t":0,"s":[0]},{"t":60.0000024438501,"s":[360]}],"ix":3},"m":1,"ix":2,"nm":"Trim Paths 1","mn":"ADBE Vector Filter - Trim","hd":false},{"ty":"st","c":{"a":0,"k":[0.9412,0.3373,0.1529,1],"ix":3},"o":{"a":0,"k":100,"ix":4},"w":{"a":0,"k":25,"ix":5},"lc":2,"lj":2,"bm":0,"nm":"Stroke 1","mn":"ADBE Vector Graphic - Stroke","hd":false},{"ty":"tr","p":{"a":0,"k":[0.576,4.576],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Ellipse 1","np":4,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false}],"ip":0,"op":90.0000036657751,"st":0,"bm":0},{"ddd":0,"ind":4,"ty":4,"nm":"Shape Layer 1","sr":1,"ks":{"o":{"a":0,"k":35,"ix":11},"r":{"a":1,"k":[{"i":{"x":[0.833],"y":[0.833]},"o":{"x":[0.167],"y":[0.167]},"t":0,"s":[0]},{"t":60.0000024438501,"s":[360]}],"ix":10},"p":{"a":0,"k":[62,62,0],"ix":2},"a":{"a":0,"k":[0.576,4.576,0],"ix":1},"s":{"a":0,"k":[100,100,100],"ix":6}},"ao":0,"shapes":[{"ty":"gr","it":[{"d":1,"ty":"el","s":{"a":0,"k":[89.152,89.152],"ix":2},"p":{"a":0,"k":[0,0],"ix":3},"nm":"Ellipse Path 1","mn":"ADBE Vector Shape - Ellipse","hd":false},{"ty":"tm","s":{"a":1,"k":[{"i":{"x":[0.667],"y":[1]},"o":{"x":[0.333],"y":[0]},"t":0,"s":[50.1]},{"i":{"x":[0.667],"y":[1]},"o":{"x":[0.333],"y":[0]},"t":30.338,"s":[70.1]},{"t":60.0000024438501,"s":[50.1]}],"ix":1},"e":{"a":1,"k":[{"i":{"x":[0.667],"y":[1]},"o":{"x":[0.333],"y":[0]},"t":0,"s":[49.9]},{"i":{"x":[0.667],"y":[1]},"o":{"x":[0.333],"y":[0]},"t":30.338,"s":[0]},{"t":60.0000024438501,"s":[49.9]}],"ix":2},"o":{"a":1,"k":[{"i":{"x":[0.833],"y":[0.833]},"o":{"x":[0.167],"y":[0.167]},"t":0,"s":[0]},{"t":60.0000024438501,"s":[360]}],"ix":3},"m":1,"ix":2,"nm":"Trim Paths 1","mn":"ADBE Vector Filter - Trim","hd":false},{"ty":"st","c":{"a":0,"k":[0.9412,0.3373,0.1529,1],"ix":3},"o":{"a":0,"k":100,"ix":4},"w":{"a":0,"k":25,"ix":5},"lc":2,"lj":2,"bm":0,"nm":"Stroke 1","mn":"ADBE Vector Graphic - Stroke","hd":false},{"ty":"tr","p":{"a":0,"k":[0.576,4.576],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Ellipse 1","np":4,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false}],"ip":0,"op":90.0000036657751,"st":0,"bm":0}],"markers":[]};
window.CYBER_LOADER_LOTTIE_DATA = CYBER_LOADER_LOTTIE_DATA;

function initAllLottieLoaders(root) {
	if (typeof lottie === 'undefined' || !window.CYBER_LOADER_LOTTIE_DATA) return;
	const scope = root && root.querySelectorAll ? root : document;
	if (!scope || !scope.querySelectorAll) return;
	const loaders = scope.querySelectorAll('.cyber-loader:not([data-lottie-init="true"]), .cyber-lottie-loader:not([data-lottie-init="true"])');
	loaders.forEach((el) => {
		el.setAttribute('data-lottie-init', 'true');
		el.innerHTML = '';
		try {
			lottie.loadAnimation({
				container: el,
				renderer: 'svg',
				loop: true,
				autoplay: true,
				animationData: window.CYBER_LOADER_LOTTIE_DATA,
			});
		} catch (e) {
			console.warn('Lottie render error:', e);
		}
	});
}
window.initAllLottieLoaders = initAllLottieLoaders;

// Auto-observe newly added loaders in the DOM
if (typeof MutationObserver !== 'undefined' && typeof document !== 'undefined') {
	const _loaderObserver = new MutationObserver((mutations) => {
		for (const m of mutations) {
			if (m.addedNodes && m.addedNodes.length > 0) {
				initAllLottieLoaders();
				break;
			}
		}
	});
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', () => {
			if (document.body) _loaderObserver.observe(document.body, { childList: true, subtree: true });
			initAllLottieLoaders();
		});
	} else if (document.body) {
		_loaderObserver.observe(document.body, { childList: true, subtree: true });
		initAllLottieLoaders();
	}
}

/**
 * Generate a unified cyber loader HTML.
 * @param {Object} opts
 * @param {'sm'|'md'|'lg'} opts.size - Loader size (default 'md')
 * @param {string} opts.color - Tailwind text color class (default 'text-cyber-accent')
 * @param {string} opts.text - Main loading text
 * @param {string} opts.subtext - Smaller secondary text
 * @param {boolean} opts.inline - Inline mode (for buttons/small areas)
 * @returns {string} HTML string
 */
function cyberLoader(opts = {}) {
	const size = opts.size || 'md';
	const color = opts.color || 'text-cyber-accent';
	const text = opts.text || '';
	const subtext = opts.subtext || '';
	const inline = opts.inline || false;

	const loader = `<div class="cyber-loader cyber-loader--${size} ${color}" data-cyber-loader="true"></div>`;

	if (typeof requestAnimationFrame !== 'undefined') {
		requestAnimationFrame(() => initAllLottieLoaders());
	} else if (typeof setTimeout !== 'undefined') {
		setTimeout(() => initAllLottieLoaders(), 0);
	}

	if (inline) {
		return `<span class="cyber-loader-inline ${color}">${loader}<span class="cyber-loader-text text-sm">${text}</span></span>`;
	}

	let html = `<div class="flex flex-col items-center justify-center gap-3">
		${loader}`;
	if (text) {
		html += `<p class="cyber-loader-text text-sm ${color}">${text}</p>`;
	}
	if (subtext) {
		html += `<p class="text-gray-400 text-xs text-center max-w-md">${subtext}</p>`;
	}
	html += `</div>`;
	return html;
}


// ===========================================
// URL NORMALIZATION
// ===========================================

/**
 * Normalize URL by adding https:// scheme if missing
 * @param {string} url - The URL to normalize
 * @returns {string} - The normalized URL with scheme
 */
function normalizeUrl(url) {
	if (!url || typeof url !== 'string') {
		return url;
	}

	const trimmedUrl = url.trim();
	if (!trimmedUrl) {
		return trimmedUrl;
	}

	// Check if URL already has a scheme (http://, https://, ftp://, etc.)
	if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmedUrl)) {
		return trimmedUrl;
	}

	// Add https:// if no scheme is present
	return `https://${trimmedUrl}`;
}


// ===========================================
// CUSTOM ALERT & CONFIRM DIALOGS
// ===========================================

let confirmResolve = null;

function showAlert(message, title = 'Information', type = 'info') {
	const modal = document.getElementById('customAlertModal');
	const titleEl = document.getElementById('alertTitle');
	const messageEl = document.getElementById('alertMessage');
	const iconEl = document.getElementById('alertIcon');

	titleEl.textContent = title;
	messageEl.textContent = message;

	// Set icon based on type
	let iconSvg = '';
	let iconClass = '';
	switch (type) {
		case 'success':
			iconClass = 'bg-cyber-success/20';
			iconSvg =
				'<svg class="w-5 h-5 text-cyber-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
			break;
		case 'error':
			iconClass = 'bg-cyber-danger/20';
			iconSvg =
				'<svg class="w-5 h-5 text-cyber-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
			break;
		case 'warning':
			iconClass = 'bg-cyber-warning/20';
			iconSvg =
				'<svg class="w-5 h-5 text-cyber-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>';
			break;
		default:
			iconClass = 'bg-cyber-accent/20';
			iconSvg =
				'<svg class="w-5 h-5 text-cyber-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
	}

	iconEl.className = `w-10 h-10 rounded-lg flex items-center justify-center ${iconClass}`;
	iconEl.innerHTML = iconSvg;

	modal.style.display = 'flex';
	document.body.style.overflow = 'hidden';
}

function closeAlert() {
	const modal = document.getElementById('customAlertModal');
	modal.style.display = 'none';
	document.body.style.overflow = '';
}

function showConfirm(message, title = 'Confirm', type = 'warning') {
	return new Promise((resolve) => {
		confirmResolve = resolve;

		const modal = document.getElementById('customConfirmModal');
		const titleEl = document.getElementById('confirmTitle');
		const messageEl = document.getElementById('confirmMessage');
		const iconEl = document.getElementById('confirmIcon');
		const okBtn = document.getElementById('confirmOkBtn');

		titleEl.textContent = title;
		messageEl.textContent = message;

		// Set icon and button based on type
		let iconSvg = '';
		let iconClass = '';
		let btnClass = '';
		switch (type) {
			case 'danger':
				iconClass = 'bg-cyber-danger/20';
				iconSvg =
					'<svg class="w-5 h-5 text-cyber-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>';
				btnClass = 'bg-cyber-danger text-white';
				break;
			case 'warning':
				iconClass = 'bg-cyber-warning/20';
				iconSvg =
					'<svg class="w-5 h-5 text-cyber-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>';
				btnClass = 'bg-cyber-warning text-cyber-bg';
				break;
			default:
				iconClass = 'bg-cyber-accent/20';
				iconSvg =
					'<svg class="w-5 h-5 text-cyber-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
				btnClass = 'bg-cyber-accent text-cyber-bg';
		}

		iconEl.className = `w-10 h-10 rounded-lg flex items-center justify-center ${iconClass}`;
		iconEl.innerHTML = iconSvg;
		okBtn.className = `px-4 py-2 font-semibold rounded-lg hover:opacity-90 transition-all text-sm ${btnClass}`;

		modal.style.display = 'flex';
		document.body.style.overflow = 'hidden';
	});
}

function closeConfirm(result) {
	const modal = document.getElementById('customConfirmModal');
	modal.style.display = 'none';
	document.body.style.overflow = '';

	if (confirmResolve) {
		confirmResolve(result);
		confirmResolve = null;
	}
}


function copyTextToClipboard(text) {
	if (navigator.clipboard && window.isSecureContext) {
		return navigator.clipboard.writeText(text);
	}
	return new Promise((resolve, reject) => {
		try {
			const textArea = document.createElement('textarea');
			textArea.value = text;
			textArea.style.position = 'fixed';
			textArea.style.left = '-999999px';
			textArea.style.top = '-999999px';
			document.body.appendChild(textArea);
			textArea.focus();
			textArea.select();
			const successful = document.execCommand('copy');
			document.body.removeChild(textArea);
			if (successful) {
				resolve();
			} else {
				reject(new Error('execCommand copy failed'));
			}
		} catch (err) {
			reject(err);
		}
	});
}
window.copyTextToClipboard = copyTextToClipboard;

function copyToClipboard(el, text) {
	copyTextToClipboard(text).then(() => {
		const icon = el.querySelector('.copy-icon');
		if (icon) {
			const original = icon.innerHTML;
			icon.innerHTML =
				'<svg class="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>';
			setTimeout(() => {
				icon.innerHTML = original;
			}, 1500);
		}
	});
}


function downloadFile(content, filename, mimeType) {
	const blob = new Blob([content], { type: mimeType });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

function generateFilename(baseUrl, extension) {
	const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
	let hostname;
	try {
		hostname = new URL(baseUrl).hostname.replace(/[^a-zA-Z0-9.-]/g, '_');
	} catch {
		hostname = 'results';
	}
	return `waf-report_${hostname}_${timestamp}.${extension}`;
}

function formatDuration(milliseconds) {
	const seconds = Math.floor(milliseconds / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);

	if (hours > 0) {
		return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
	} else if (minutes > 0) {
		return `${minutes}m ${seconds % 60}s`;
	} else {
		return `${seconds}s`;
	}
}

// =============================================
// Recon tooltip helper (global fixed tooltip)
// =============================================
function reconTip(tip) {
	return `<span class="recon-tip" data-tip="${tip.replace(/"/g, '&quot;')}" onmouseenter="showReconTip(this)" onmouseleave="hideReconTip()"><svg class="w-3.5 h-3.5 text-slate-400 hover:text-cyber-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"/><path stroke-width="2" stroke-linecap="round" d="M12 16v-4m0-4h.01"/></svg></span>`;
}
function showReconTip(el) {
	const tt = document.getElementById('reconTooltip');
	if (!tt) return;
	tt.textContent = el.getAttribute('data-tip');
	const r = el.getBoundingClientRect();
	tt.style.left = Math.min(r.left + r.width / 2 - 140, window.innerWidth - 290) + 'px';
	tt.style.left = Math.max(8, parseFloat(tt.style.left)) + 'px';
	tt.style.top = r.bottom + 8 + 'px';
	tt.classList.add('visible');
}
function hideReconTip() {
	const tt = document.getElementById('reconTooltip');
	if (tt) tt.classList.remove('visible');
}

// Expose to window for global access
window.escapeHtml = escapeHtml;
window.cyberLoader = cyberLoader;
window.normalizeUrl = normalizeUrl;
window.showAlert = showAlert;
window.closeAlert = closeAlert;
window.showConfirm = showConfirm;
window.closeConfirm = closeConfirm;
window.copyToClipboard = copyToClipboard;
window.downloadFile = downloadFile;
window.generateFilename = generateFilename;
window.formatDuration = formatDuration;
window.reconTip = reconTip;
window.showReconTip = showReconTip;
window.hideReconTip = hideReconTip;
