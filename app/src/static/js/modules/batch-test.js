/**
 * WAF-Checker - Batch Testing Module
 */

var currentBatchJob = null;
var batchPollInterval = null;

function showBatchModal() {
	const modal = new bootstrap.Modal(document.getElementById('batchModal'));
	modal.show();

	// Reset modal state
	document.getElementById('batchProgress').style.display = 'none';
	document.getElementById('batchResults').style.display = 'none';
	document.getElementById('startBatchBtn').style.display = 'inline-block';
	document.getElementById('stopBatchBtn').style.display = 'none';
	document.getElementById('exportBatchBtn').style.display = 'none';

	// Load sample URLs if empty
	const urlsTextarea = document.getElementById('batchUrls');
	if (!urlsTextarea.value.trim()) {
		urlsTextarea.value = 'https://httpbin.org/get\nhttps://jsonplaceholder.typicode.com/posts/1\nhttps://httpbin.org/status/200';
	}

	// Add real-time URL validation feedback
	urlsTextarea.addEventListener('input', function () {
		validateBatchUrls();
	});
}

async function startBatchTest() {
	const urlsText = document.getElementById('batchUrls').value;
	const maxConcurrent = parseInt(document.getElementById('batchMaxConcurrent').value);
	const delay = parseInt(document.getElementById('batchDelay').value);
	const inheritSettings = document.getElementById('batchInheritSettings').checked;

	// Parse and validate URLs
	const allLines = urlsText
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line.length > 0);

	if (allLines.length === 0) {
		showAlert('Please enter at least one URL', 'Warning', 'warning');
		return;
	}

	// Validate URLs client-side
	const validUrls = [];
	const invalidUrls = [];

	allLines.forEach((line) => {
		try {
			// Normalize URL by adding https:// if no scheme is present
			const normalizedUrl = normalizeUrl(line);

			const url = new URL(normalizedUrl);
			if (url.protocol === 'http:' || url.protocol === 'https:') {
				validUrls.push(normalizedUrl);
			} else {
				invalidUrls.push(`${line} (unsupported protocol: ${url.protocol})`);
			}
		} catch (error) {
			invalidUrls.push(`${line} (invalid URL format)`);
		}
	});

	// Show validation results
	if (invalidUrls.length > 0) {
		const message = `Found ${invalidUrls.length} invalid URL(s):\n\n${invalidUrls.slice(0, 5).join('\n')}${
			invalidUrls.length > 5 ? `\n... and ${invalidUrls.length - 5} more` : ''
		}\n\nContinue with ${validUrls.length} valid URLs?`;

		const confirmed = await showConfirm(message, 'Invalid URLs Found', 'warning');
		if (!confirmed) {
			return;
		}
	}

	if (validUrls.length === 0) {
		showAlert('No valid URLs found. Please check your input.', 'Error', 'error');
		return;
	}

	if (validUrls.length > 100) {
		showAlert('Maximum 100 URLs allowed for batch testing', 'Warning', 'warning');
		return;
	}

	const urls = validUrls;

	// Prepare batch configuration
	const config = {
		maxConcurrent,
		delayBetweenRequests: delay,
	};

	if (inheritSettings) {
		const methodCheckboxes = document.querySelectorAll('.http-methods input[type=checkbox]');
		const selectedMethods = Array.from(methodCheckboxes)
			.filter((cb) => cb.checked)
			.map((cb) => cb.value);

		const categoryCheckboxes = document.querySelectorAll('#categoryCheckboxes input[type=checkbox]');
		const selectedCategories = Array.from(categoryCheckboxes)
			.filter((cb) => cb.checked)
			.map((cb) => cb.value);

		config.methods = selectedMethods;
		config.categories = selectedCategories;
		config.followRedirect = document.getElementById('followRedirect')?.checked || false;
		config.falsePositiveTest = document.getElementById('falsePositiveTest')?.checked || false;
		config.caseSensitiveTest = document.getElementById('caseSensitiveTest')?.checked || false;
		config.enhancedPayloads = document.getElementById('enhancedPayloads')?.checked || false;
		config.useAdvancedPayloads = document.getElementById('useAdvancedPayloadsCheckbox')?.checked || false;
		config.autoDetectWAF = document.getElementById('autoDetectWAF')?.checked || false;
		config.useEncodingVariations = document.getElementById('useEncodingVariations')?.checked || false;
		config.httpManipulation = document.getElementById('httpManipulation')?.checked || false;
		config.adaptiveMutation = document.getElementById('adaptiveMutation')?.checked || false;
		config.payloadTemplate = document.getElementById('payloadTemplate')?.value || '';
		config.customHeaders = document.getElementById('customHeaders')?.value || '';
	} else {
		config.methods = ['GET'];
		config.categories = ['SQL Injection', 'XSS'];
		config.followRedirect = false;
		config.falsePositiveTest = false;
		config.caseSensitiveTest = false;
		config.enhancedPayloads = false;
		config.useAdvancedPayloads = false;
		config.autoDetectWAF = false;
		config.useEncodingVariations = false;
		config.httpManipulation = false;
		config.adaptiveMutation = false;
	}

	try {
		// Initialize client-side batch processing
		currentBatchJob = {
			urls: urls,
			config: config,
			results: [],
			currentIndex: 0,
			completedCount: 0,
			startTime: new Date().toISOString(),
			status: 'running',
		};

		// Update UI
		document.getElementById('batchProgress').style.display = 'block';
		document.getElementById('startBatchBtn').style.display = 'none';
		document.getElementById('stopBatchBtn').style.display = 'inline-block';
		document.getElementById('batchTotal').textContent = urls.length;

		// Reset progress display
		document.getElementById('batchProgressText').textContent = '0%';
		document.getElementById('batchProgressBar').style.width = '0%';
		document.getElementById('batchProgressBar').classList.add('progress-bar-animated');
		document.getElementById('batchCurrentUrl').textContent = 'Starting...';
		document.getElementById('batchCompleted').textContent = '0';
		document.getElementById('batchETA').textContent = 'Calculating...';

		// Start client-side batch processing
		startClientSideBatchProcessing();

		console.log(`Started client-side batch test with ${urls.length} URLs`);
	} catch (error) {
		console.error('Batch test failed:', error);

		// Show a more user-friendly error message
		const errorLines = error.message.split('\n');
		const mainError = errorLines[0];
		const details = errorLines.slice(1).join('\n');

		let alertMessage = `Failed to start batch test: ${mainError}`;
		if (details.trim()) {
			alertMessage += `\n\nDetails:${details}`;
		}

		showAlert(alertMessage, 'Batch Test Complete', 'success');

		// Reset UI state
		document.getElementById('batchProgress').style.display = 'none';
		document.getElementById('startBatchBtn').style.display = 'inline-block';
		document.getElementById('stopBatchBtn').style.display = 'none';
	}
}

async function stopBatchTest() {
	if (!currentBatchJob) return;

	try {
		// Stop client-side processing
		if (currentBatchJob) {
			currentBatchJob.status = 'stopped';
		}

		if (batchPollInterval) {
			clearInterval(batchPollInterval);
			batchPollInterval = null;
		}

		document.getElementById('startBatchBtn').style.display = 'inline-block';
		document.getElementById('stopBatchBtn').style.display = 'none';

		console.log('Batch test stopped by user');
	} catch (error) {
		console.error('Failed to stop batch test:', error);
	}
}

async function startClientSideBatchProcessing() {
	if (!currentBatchJob || currentBatchJob.status !== 'running') return;

	const { urls, config } = currentBatchJob;
	const delay = config.delayBetweenRequests || 1000;

	// Process URLs sequentially with delay
	for (let i = 0; i < urls.length && currentBatchJob.status === 'running'; i++) {
		const url = urls[i];
		currentBatchJob.currentIndex = i;

		// Update current URL display
		updateBatchProgress(url, i, urls.length);

		try {
			// Test single URL
			const result = await testSingleUrlClient(url, config);

			if (currentBatchJob.status === 'running') {
				currentBatchJob.results.push({
					url: url,
					success: true,
					results: result,
					timestamp: new Date().toISOString(),
					totalTests: result.length,
					bypassedTests: result.filter((r) => r.status === 200 || r.status === '200').length,
					bypassRate:
						result.length > 0 ? Math.round((result.filter((r) => r.status === 200 || r.status === '200').length / result.length) * 100) : 0,
				});

				currentBatchJob.completedCount++;
			}
		} catch (error) {
			console.error(`Error testing URL ${url}:`, error);

			if (currentBatchJob.status === 'running') {
				currentBatchJob.results.push({
					url: url,
					success: false,
					error: error.message,
					timestamp: new Date().toISOString(),
					totalTests: 0,
					bypassedTests: 0,
					bypassRate: 0,
				});

				currentBatchJob.completedCount++;
			}
		}

		// Apply delay between requests (except for the last one)
		if (i < urls.length - 1 && delay > 0 && currentBatchJob.status === 'running') {
			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}

	// Mark as completed
	if (currentBatchJob.status === 'running') {
		currentBatchJob.status = 'completed';
		finalizeBatchTest();
	}
}

function updateBatchProgress(currentUrl, completed, total) {
	const progress = Math.round((completed / total) * 100);

	const progressText = document.getElementById('batchProgressText');
	const progressBar = document.getElementById('batchProgressBar');
	const currentUrlElement = document.getElementById('batchCurrentUrl');
	const completedElement = document.getElementById('batchCompleted');
	const eta = document.getElementById('batchETA');

	if (progressText) progressText.textContent = `${progress}%`;
	if (progressBar) {
		progressBar.style.width = `${progress}%`;
		if (progress > 0) {
			progressBar.classList.remove('bg-secondary');
			progressBar.classList.add('bg-primary');
		}
	}
	if (currentUrlElement) {
		const displayUrl = currentUrl.length > 50 ? currentUrl.substring(0, 47) + '...' : currentUrl;
		currentUrlElement.textContent = displayUrl;
		currentUrlElement.title = currentUrl;
	}
	if (completedElement) completedElement.textContent = completed;

	// Calculate ETA
	if (completed > 0 && currentBatchJob) {
		const elapsed = Date.now() - new Date(currentBatchJob.startTime).getTime();
		const avgTimePerUrl = elapsed / completed;
		const remaining = (total - completed) * avgTimePerUrl;
		const delayTime = (total - completed - 1) * (currentBatchJob.config.delayBetweenRequests || 0);
		const totalRemaining = remaining + delayTime;

		if (eta) eta.textContent = formatDuration(totalRemaining);
	}
}

async function testSingleUrlClient(url, config) {
	const methods = config.methods || ['GET'];
	const categories = config.categories || ['SQL Injection', 'XSS'];

	// Get custom payloads from localStorage
	let customPayloadsData = {};
	try {
		const stored = localStorage.getItem('wafchecker_customPayloads');
		if (stored) {
			customPayloadsData = JSON.parse(stored);
		}
	} catch (e) {
		console.warn('Failed to load custom payloads:', e);
	}

	let allResults = [];
	let page = 0;

	while (true) {
		const params = new URLSearchParams({
			url,
			methods: methods.join(','),
			categories: categories.join(','),
			page: page.toString(),
			followRedirect: config.followRedirect ? '1' : '0',
			falsePositiveTest: config.falsePositiveTest ? '1' : '0',
			caseSensitiveTest: config.caseSensitiveTest ? '1' : '0',
			enhancedPayloads: config.enhancedPayloads ? '1' : '0',
			useAdvancedPayloads: config.useAdvancedPayloads ? '1' : '0',
			autoDetectWAF: config.autoDetectWAF ? '1' : '0',
			useEncodingVariations: config.useEncodingVariations ? '1' : '0',
			httpManipulation: config.httpManipulation ? '1' : '0',
			adaptiveMutation: config.adaptiveMutation ? '1' : '0',
		});

		const response = await fetch(`/api/check?${params.toString()}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				payloadTemplate: config.payloadTemplate || '',
				customHeaders: config.customHeaders || '',
				customPayloads: customPayloadsData,
			}),
		});

		if (!response.ok) break;

		const results = await response.json();
		if (!results || !results.length) break;

		allResults = allResults.concat(results);
		page++;

		// Limit results to prevent memory issues
		if (allResults.length > 1000) break;
	}

	return allResults;
}

function finalizeBatchTest() {
	if (!currentBatchJob) return;

	// Update UI
	const startBtn = document.getElementById('startBatchBtn');
	const stopBtn = document.getElementById('stopBatchBtn');
	const exportBtn = document.getElementById('exportBatchBtn');

	if (startBtn) startBtn.style.display = 'inline-block';
	if (stopBtn) stopBtn.style.display = 'none';
	if (exportBtn) exportBtn.style.display = 'inline-block';

	// Final progress update
	const progressText = document.getElementById('batchProgressText');
	const progressBar = document.getElementById('batchProgressBar');
	const currentUrl = document.getElementById('batchCurrentUrl');
	const eta = document.getElementById('batchETA');

	if (progressText) progressText.textContent = '100%';
	if (progressBar) {
		progressBar.style.width = '100%';
		progressBar.classList.remove('progress-bar-animated', 'bg-primary');
		progressBar.classList.add(currentBatchJob.status === 'completed' ? 'bg-success' : 'bg-warning');
	}
	if (currentUrl) {
		currentUrl.textContent =
			currentBatchJob.status === 'completed'
				? 'All tests completed'
				: currentBatchJob.status === 'stopped'
					? 'Test stopped by user'
					: 'Test completed with errors';
	}
	if (eta) eta.textContent = 'Done';

	// Show results
	displayBatchResults({
		status: currentBatchJob.status,
		results: currentBatchJob.results,
		totalUrls: currentBatchJob.urls.length,
		completedUrls: currentBatchJob.completedCount,
		progress: 100,
	});

	console.log(`Batch test ${currentBatchJob.status}:`, currentBatchJob.results);
}

function displayBatchResults(job) {
	const resultsDiv = document.getElementById('batchResults');
	const summaryDiv = document.getElementById('batchSummary');

	if (!resultsDiv || !summaryDiv) return;

	const successful = job.results.filter((r) => r.success);
	const failed = job.results.filter((r) => !r.success);

	let html = `
		<div class="row">
			<div class="col-md-3">
				<div class="text-center">
					<div class="h4 text-primary">${job.totalUrls}</div>
					<small>Total URLs</small>
				</div>
			</div>
			<div class="col-md-3">
				<div class="text-center">
					<div class="h4 text-success">${successful.length}</div>
					<small>Successful</small>
				</div>
			</div>
			<div class="col-md-3">
				<div class="text-center">
					<div class="h4 text-danger">${failed.length}</div>
					<small>Failed</small>
				</div>
			</div>
			<div class="col-md-3">
				<div class="text-center">
					<div class="h4 text-info">${job.progress}%</div>
					<small>Progress</small>
				</div>
			</div>
		</div>
	`;

	if (successful.length > 0) {
		const avgBypassRate = successful.reduce((sum, r) => sum + (r.bypassRate || 0), 0) / successful.length;
		html += `<div class="mt-3"><strong>Average Bypass Rate:</strong> ${Math.round(avgBypassRate * 100) / 100}%</div>`;
	}

	summaryDiv.innerHTML = html;
	resultsDiv.style.display = 'block';
}

function exportBatchResults() {
	if (!currentBatchJob || !currentBatchJob.results) {
		showAlert('No batch results to export', 'Warning', 'warning');
		return;
	}

	const summary = generateBatchSummary(currentBatchJob.results);
	const exportData = {
		summary,
		results: currentBatchJob.results,
		exportedAt: new Date().toISOString(),
		version: '1.0.0',
	};

	const content = JSON.stringify(exportData, null, 2);
	const filename = `batch-results_${new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19)}.json`;
	downloadFile(content, filename, 'application/json');
}

function generateBatchSummary(results) {
	const successful = results.filter((r) => r.success);
	const failed = results.filter((r) => !r.success);

	const totalTestCases = successful.reduce((sum, r) => sum + (r.results?.length || 0), 0);
	const avgBypassRate = successful.length > 0 ? successful.reduce((sum, r) => sum + (r.bypassRate || 0), 0) / successful.length : 0;

	return {
		totalUrls: results.length,
		successfulTests: successful.length,
		failedTests: failed.length,
		totalTestCases,
		averageBypassRate: Math.round(avgBypassRate * 100) / 100,
	};
}



function validateBatchUrls() {
	const urlsText = document.getElementById('batchUrls').value;
	const lines = urlsText
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line.length > 0);

	let validCount = 0;
	let invalidCount = 0;

	lines.forEach((line) => {
		try {
			// Normalize URL by adding https:// if no scheme is present
			const normalizedUrl = normalizeUrl(line);
			new URL(normalizedUrl);
			validCount++;
		} catch (error) {
			invalidCount++;
		}
	});

	// Update UI with validation status
	const startBtn = document.getElementById('startBatchBtn');
	if (startBtn) {
		if (validCount === 0 && lines.length > 0) {
			startBtn.disabled = true;
			startBtn.textContent = 'No Valid URLs';
		} else if (validCount > 100) {
			startBtn.disabled = true;
			startBtn.textContent = `Too Many URLs (${validCount}/100)`;
		} else {
			startBtn.disabled = false;
			startBtn.textContent = validCount > 0 ? `Start Batch Test (${validCount} URLs)` : 'Start Batch Test';
		}
	}

	// Show validation summary
	const urlsTextarea = document.getElementById('batchUrls');
	if (urlsTextarea && lines.length > 0) {
		if (invalidCount > 0) {
			urlsTextarea.style.borderColor = '#ffc107';
			urlsTextarea.title = `${validCount} valid, ${invalidCount} invalid URLs`;
		} else {
			urlsTextarea.style.borderColor = '#198754';
			urlsTextarea.title = `${validCount} valid URLs`;
		}
	} else if (urlsTextarea) {
		urlsTextarea.style.borderColor = '';
		urlsTextarea.title = '';
	}
}


// Expose to window for global access
window.showBatchModal = showBatchModal;
window.startBatchTest = startBatchTest;
window.stopBatchTest = stopBatchTest;
window.startClientSideBatchProcessing = startClientSideBatchProcessing;
window.updateBatchProgress = updateBatchProgress;
window.testSingleUrlClient = testSingleUrlClient;
window.finalizeBatchTest = finalizeBatchTest;
window.displayBatchResults = displayBatchResults;
window.exportBatchResults = exportBatchResults;
window.generateBatchSummary = generateBatchSummary;
window.validateBatchUrls = validateBatchUrls;
