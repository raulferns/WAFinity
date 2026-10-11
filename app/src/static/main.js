/**
 * WAF-CHECKER.COM - Application Entry Point Loader
 * Loads all modular scripts in dependency order if they have not been loaded yet.
 */
(function () {
	if (window.initApp) return;

	const scripts = [
		'js/vendor/lottie.min.js',
		'js/utils/common.js',
		'js/utils/http-codes.js',
		'js/modules/export.js',
		'js/modules/analytics.js',
		'js/modules/waf-detector.js',
		'js/modules/custom-payloads.js',
		'js/modules/batch-test.js',
		'js/modules/api-docs.js',
		'js/modules/scan-history.js',
		'js/modules/headers.js',
		'js/modules/speed-test.js',
		'js/modules/seo-audit.js',
		'js/modules/full-recon.js',
		'js/main.js',
	];

	scripts.forEach(function (src) {
		const script = document.createElement('script');
		script.src = src;
		script.async = false;
		document.head.appendChild(script);
	});
})();
