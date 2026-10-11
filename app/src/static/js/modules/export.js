/**
 * WAF-Checker - Reporting & Export Module
 */

function showExportControls() {
	const exportControls = document.getElementById('exportControls');
	if (exportControls && currentTestSession) {
		exportControls.style.display = 'block';
	}
}

function hideExportControls() {
	const exportControls = document.getElementById('exportControls');
	if (exportControls) {
		exportControls.style.display = 'none';
	}
}

function exportResults(format) {
	if (!currentTestSession) {
		showAlert('No test results to export', 'Warning', 'warning');
		return;
	}

	try {
		switch (format) {
			case 'json':
				exportAsJSON(currentTestSession, true);
				break;
			case 'csv':
				exportAsCSV(currentTestSession.results);
				break;
			case 'pdf':
				exportAsHTMLReport(currentTestSession);
				break;
			default:
				showAlert('Unknown export format', 'Error', 'error');
		}
	} catch (error) {
		console.error('Export failed:', error);
		showAlert('Export failed. Please check the console for details.', 'Error', 'error');
	}
}

function exportAsJSON(session, includeAnalysis) {
	const exportData = {
		...session,
		exportedAt: new Date().toISOString(),
		version: '1.0.0',
	};

	if (includeAnalysis) {
		const vulnerabilityScores = generateVulnerabilityScores(session.results, session.settings.falsePositiveTest);
		const executiveSummary = generateExecutiveSummary(session.results, vulnerabilityScores, session.wafDetection, session.settings.falsePositiveTest);

		exportData.analysis = {
			vulnerabilityScores,
			executiveSummary,
		};
	}

	const content = JSON.stringify(exportData, null, 2);
	const filename = generateFilename(session.url, 'json');
	downloadFile(content, filename, 'application/json');
}

function exportAsCSV(results) {
	if (results.length === 0) {
		showAlert('No results to export', 'Warning', 'warning');
		return;
	}

	const headers = [
		'Category',
		'Method',
		'Status',
		'Response Time (ms)',
		'Payload',
		'Is Redirect',
		'WAF Detected',
		'WAF Type',
		'Timestamp',
		'URL',
	];

	// Compute response time stats for summary rows
	let totalTime = 0,
		slowCount = 0,
		minTime = Infinity,
		maxTime = 0;
	for (const r of results) {
		const rt = r.responseTime || 0;
		totalTime += rt;
		if (rt >= SLOW_RESPONSE_THRESHOLD) slowCount++;
		if (rt < minTime) minTime = rt;
		if (rt > maxTime) maxTime = rt;
	}
	if (minTime === Infinity) minTime = 0;
	const avgTime = results.length > 0 ? Math.round(totalTime / results.length) : 0;

	const csvRows = [
		headers.join(','),
		...results.map((result) =>
			[
				`"${result.category}"`,
				`"${result.method}"`,
				result.status,
				result.responseTime || 0,
				`"${result.payload.replace(/"/g, '""')}"`,
				result.is_redirect || false,
				result.wafDetected || false,
				`"${result.wafType || ''}"`,
				`"${result.timestamp || ''}"`,
				`"${result.url || ''}"`,
			].join(','),
		),
		'',
		'"--- Results Summary ---"',
		`"Risk Level","${(() => {
			const isFP = currentTestSession?.settings?.falsePositiveTest;
			const bypassed = results.filter((r) => isFP ? (r.status === 403 || r.status === '403') : (r.status === 200 || r.status === '200' || r.status === 500 || r.status === '500')).length;
			const rate = results.length > 0 ? (bypassed / results.length) * 100 : 0;
			if (rate > 75) return 'Critical';
			if (rate > 50) return 'High';
			if (rate > 25) return 'Medium';
			return 'Low';
		})()} "`,
		`"${currentTestSession?.settings?.falsePositiveTest ? 'WAF Accuracy' : 'WAF Effectiveness'} (%)",${(() => {
			const isFP = currentTestSession?.settings?.falsePositiveTest;
			const bypassed = results.filter((r) => isFP ? (r.status === 403 || r.status === '403') : (r.status === 200 || r.status === '200' || r.status === 500 || r.status === '500')).length;
			return results.length > 0 ? Math.round((100 - (bypassed / results.length) * 100) * 100) / 100 : 100;
		})()}`,
		`"Total Tests",${results.length}`,
		`"${currentTestSession?.settings?.falsePositiveTest ? 'False Positives' : 'Bypassed'}",${(() => {
			const isFP = currentTestSession?.settings?.falsePositiveTest;
			return results.filter((r) => isFP ? (r.status === 403 || r.status === '403') : (r.status === 200 || r.status === '200' || r.status === 500 || r.status === '500')).length;
		})()}`,
		'',
		'"--- Response Time Summary ---"',
		`"Avg Response Time (ms)",${avgTime}`,
		`"Min Response Time (ms)",${minTime}`,
		`"Max Response Time (ms)",${maxTime}`,
		`"Slow Requests (>${SLOW_RESPONSE_THRESHOLD}ms)",${slowCount}`,
		'',
		'"--- Test Configuration ---"',
		`"HTTP Methods","${(currentTestSession?.settings?.methods || []).join(', ')}"`,
		`"Tested Categories","${(currentTestSession?.settings?.categories || []).join(', ')}"`,
		`"Follow Redirects",${currentTestSession?.settings?.followRedirect ? 'Yes' : 'No'}`,
		`"False Positive Test",${currentTestSession?.settings?.falsePositiveTest ? 'Yes' : 'No'}`,
		`"Case Sensitive Test",${currentTestSession?.settings?.caseSensitiveTest ? 'Yes' : 'No'}`,
		`"Enhanced Payloads",${currentTestSession?.settings?.enhancedPayloads ? 'Yes' : 'No'}`,
		`"Advanced Payloads",${currentTestSession?.settings?.useAdvancedPayloads ? 'Yes' : 'No'}`,
		`"Auto Detect WAF",${currentTestSession?.settings?.autoDetectWAF ? 'Yes' : 'No'}`,
		`"Encoding Variations",${currentTestSession?.settings?.useEncodingVariations ? 'Yes' : 'No'}`,
		`"HTTP Manipulation",${currentTestSession?.settings?.httpManipulation ? 'Yes' : 'No'}`,
	];

	const content = csvRows.join('\n');
	const filename = generateFilename(currentTestSession?.url || 'results', 'csv');
	downloadFile(content, filename, 'text/csv');
}

function exportAsHTMLReport(session) {
	const vulnerabilityScores = generateVulnerabilityScores(session.results, session.settings.falsePositiveTest);
	const executiveSummary = generateExecutiveSummary(session.results, vulnerabilityScores, session.wafDetection, session.settings.falsePositiveTest);

	const html = generateHTMLReport(session, vulnerabilityScores, executiveSummary, session.settings.falsePositiveTest);
	const filename = generateFilename(session.url, 'html');
	downloadFile(html, filename, 'text/html');

	showAlert("HTML report downloaded. Use your browser's Print to PDF feature to create a PDF.", 'Success', 'success');
}

function generateHTMLReport(session, vulnerabilityScores, executiveSummary, falsePositiveMode = false) {
	const getRiskColor = (risk) => {
		switch (risk) {
			case 'Critical':
				return '#f43f5e';
			case 'High':
				return '#f59e0b';
			case 'Medium':
				return '#f05627';
			case 'Low':
				return '#10b981';
			default:
				return '#64748b';
		}
	};

	const getStatusColor = (status, falsePositiveMode = false) => {
		const statusStr = String(status);
		const codeNum = parseInt(statusStr, 10);

		if (isNaN(codeNum)) {
			return 'rgba(249, 115, 22, 0.2)'; // Orange for errors
		}

		if (falsePositiveMode) {
			if (codeNum >= 200 && codeNum < 300) {
				return 'rgba(34, 197, 94, 0.2)'; // Green for allowed
			} else if (codeNum === 403) {
				return 'rgba(239, 68, 68, 0.2)'; // Red for blocked
			}
		} else {
			if (codeNum === 403) {
				return 'rgba(34, 197, 94, 0.2)'; // Green for protected
			} else if (codeNum >= 200 && codeNum < 300) {
				return 'rgba(239, 68, 68, 0.2)'; // Red for vulnerable
			}
		}

		if (codeNum >= 300 && codeNum < 400) {
			return 'rgba(249, 115, 22, 0.2)'; // Orange for redirects
		}

		return 'rgba(107, 114, 128, 0.1)'; // Gray for others
	};

	const getStatusBorderColor = (status, falsePositiveMode = false) => {
		const statusStr = String(status);
		const codeNum = parseInt(statusStr, 10);

		if (isNaN(codeNum)) {
			return '#f97316'; // Orange
		}

		if (falsePositiveMode) {
			if (codeNum >= 200 && codeNum < 300) {
				return '#22c55e'; // Green
			} else if (codeNum === 403) {
				return '#ef4444'; // Red
			}
		} else {
			if (codeNum === 403) {
				return '#22c55e'; // Green
			} else if (codeNum >= 200 && codeNum < 300) {
				return '#ef4444'; // Red
			}
		}

		if (codeNum >= 300 && codeNum < 400) {
			return '#f97316'; // Orange
		}

		return '#6b7280'; // Gray
	};

	const startDate = new Date(session.startTime);
	const endDate = new Date(session.endTime);
	const dateStr = startDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
	const startTimeStr = startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
	const endTimeStr = endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
	const duration = Math.round((endDate - startDate) / 1000);

	return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WAF Security Assessment Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Outfit', system-ui, -apple-system, sans-serif;
            background: #090d16;
            color: #e5e7eb;
            padding: 40px 20px;
            line-height: 1.6;
        }
        .container { max-width: 1400px; margin: 0 auto; }
        .header {
            background: #151c2e;
            border: 1px solid rgba(56, 189, 248, 0.2);
            border-radius: 16px;
            padding: 40px;
            margin-bottom: 30px;
            text-align: center;
        }
        .header h1 {
            font-size: 32px;
            font-weight: 700;
            color: #f05627;
            margin-bottom: 20px;
        }
        .header-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 30px;
            text-align: left;
        }
        .info-item {
            background: #1c2438;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid rgba(240, 86, 39, 0.15);
        }
        .info-label {
            font-size: 12px;
            color: #9ca3af;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
        }
        .info-value {
            font-size: 14px;
            color: #ffffff;
            font-weight: 500;
            font-family: 'JetBrains Mono', monospace;
        }
        .card {
            background: #151c2e;
            border: 1px solid rgba(240, 86, 39, 0.15);
            border-radius: 16px;
            padding: 30px;
            margin-bottom: 30px;
        }
        .card-title {
            font-size: 20px;
            font-weight: 700;
            color: #f05627;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .metric-card {
            background: #1c2438;
            border: 1px solid rgba(240, 86, 39, 0.15);
            border-radius: 12px;
            padding: 20px;
            text-align: center;
        }
        .metric-value {
            font-size: 36px;
            font-weight: 700;
            color: #f05627;
            margin-bottom: 8px;
        }
        .metric-label {
            font-size: 12px;
            color: #9ca3af;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .risk-badge {
            display: inline-block;
            padding: 8px 20px;
            border-radius: 8px;
            font-weight: 700;
            font-size: 16px;
            color: white;
            background-color: ${getRiskColor(executiveSummary.riskLevel)};
            margin: 20px 0;
        }
        .table-wrapper {
            overflow-x: auto;
            margin: 20px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
        }
        thead {
            background: rgba(56, 189, 248, 0.08);
        }
        th {
            padding: 15px;
            text-align: left;
            font-weight: 700;
            color: #9ca3af;
            text-transform: uppercase;
            font-size: 12px;
            letter-spacing: 0.5px;
            border-bottom: 2px solid rgba(240, 86, 39, 0.2);
        }
        td {
            padding: 12px 15px;
            border-bottom: 1px solid rgba(148, 163, 184, 0.1);
            color: #e5e7eb;
        }
        tbody tr:hover {
            background: rgba(56, 189, 248, 0.04);
        }
        .severity-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 6px;
            font-weight: 700;
            font-size: 12px;
        }
        .severity-critical { background: rgba(244, 63, 94, 0.15); color: #f43f5e; border: 1px solid rgba(244, 63, 94, 0.3); }
        .severity-high { background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); }
        .severity-medium { background: rgba(240, 86, 39, 0.15); color: #f05627; border: 1px solid rgba(240, 86, 39, 0.3); }
        .severity-low { background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); }
        .recommendations {
            background: #1c2438;
            border-left: 4px solid #f05627;
            padding: 25px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .recommendations ol {
            margin-left: 20px;
            color: #d1d5db;
        }
        .recommendations li {
            margin: 10px 0;
            line-height: 1.8;
        }
        .results-section {
            margin-top: 40px;
        }
        .result-row {
            border-left: 4px solid;
            transition: all 0.2s;
        }
        .status-code {
            font-family: 'JetBrains Mono', monospace;
            font-weight: 700;
            padding: 4px 8px;
            border-radius: 4px;
            display: inline-block;
        }
        .payload {
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            color: #9ca3af;
            word-break: break-all;
            max-width: 500px;
        }
        .footer {
            text-align: center;
            margin-top: 60px;
            padding-top: 30px;
            border-top: 1px solid rgba(148, 163, 184, 0.15);
            color: #6b7280;
            font-size: 12px;
        }
        @media print {
            body { background: #090d16; }
            .page-break { page-break-before: always; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛡️ WAF Security Assessment Report</h1>
            <div class="header-info">
                <div class="info-item">
                    <div class="info-label">Target URL</div>
                    <div class="info-value">${escapeHtml(session.url)}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Test Date</div>
                    <div class="info-value">${dateStr}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Test Time</div>
                    <div class="info-value">${startTimeStr} - ${endTimeStr}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Duration</div>
                    <div class="info-value">${duration} seconds</div>
                </div>
            </div>
        </div>

        <div class="card">
            <h2 class="card-title">📊 Executive Summary</h2>
            <div style="text-align: center;">
                <span class="risk-badge">${executiveSummary.riskLevel} Risk Level</span>
            </div>
            <div class="metrics-grid">
                <div class="metric-card" style="border-color: ${getRiskColor(executiveSummary.riskLevel)}40; background: ${getRiskColor(executiveSummary.riskLevel)}15;">
                    <div class="metric-value" style="font-size: 28px; color: ${getRiskColor(executiveSummary.riskLevel)}">${executiveSummary.riskLevel}</div>
                    <div class="metric-label">Risk Level</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value" style="color: ${executiveSummary.wafEffectiveness < 75 ? '#f59e0b' : '#10b981'}">${executiveSummary.wafEffectiveness}%</div>
                    <div class="metric-label">${falsePositiveMode ? 'WAF Accuracy' : 'WAF Effectiveness'}</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${executiveSummary.totalTests}</div>
                    <div class="metric-label">Total Tests</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value" style="color: ${executiveSummary.bypassedTests > 0 ? '#f43f5e' : '#10b981'}">${executiveSummary.bypassedTests}</div>
                    <div class="metric-label">${falsePositiveMode ? 'False Positives' : 'Bypassed'}</div>
                </div>
            </div>
            ${(() => {
							const results = session.results || [];
							let totalTime = 0,
								slowCount = 0,
								minT = Infinity,
								maxT = 0;
							for (const r of results) {
								const rt = r.responseTime || 0;
								totalTime += rt;
								if (rt >= 2000) slowCount++;
								if (rt < minT) minT = rt;
								if (rt > maxT) maxT = rt;
							}
							const avgT = results.length > 0 ? Math.round(totalTime / results.length) : 0;
							if (minT === Infinity) minT = 0;
							const avgColor = avgT >= 2000 ? '#f43f5e' : avgT >= 1000 ? '#f59e0b' : avgT >= 500 ? '#f59e0b' : '#10b981';
							return `
            <div class="metrics-grid" style="margin-top: 0;">
                <div class="metric-card">
                    <div class="metric-value" style="font-size: 28px; color: ${avgColor}">${avgT}<span style="font-size: 14px; font-weight: 400;">ms</span></div>
                    <div class="metric-label">Avg Response Time</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value" style="font-size: 28px; color: #f05627;">${minT}<span style="font-size: 14px; font-weight: 400;">ms</span></div>
                    <div class="metric-label">Fastest</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value" style="font-size: 28px; color: #f05627;">${maxT}<span style="font-size: 14px; font-weight: 400;">ms</span></div>
                    <div class="metric-label">Slowest</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value" style="font-size: 28px; color: ${slowCount > 0 ? '#f59e0b' : '#64748b'};">${slowCount}</div>
                    <div class="metric-label">Slow Requests (&gt;2s)</div>
                </div>
            </div>`;
						})()}
        </div>

        ${
					session.wafDetection?.detected
						? `
        <div class="card">
            <h2 class="card-title">🔍 WAF Detection</h2>
            <div class="info-item" style="max-width: 500px;">
                <div class="info-label">Detected WAF</div>
                <div class="info-value">${escapeHtml(session.wafDetection.wafType)}</div>
            </div>
            <div class="info-item" style="max-width: 500px; margin-top: 15px;">
                <div class="info-label">Confidence</div>
                <div class="info-value">${session.wafDetection.confidence}%</div>
            </div>
        </div>
        `
						: ''
				}

        <div class="card">
            <h2 class="card-title">⚙️ Test Configuration</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                <div class="info-item">
                    <div class="info-label">HTTP Methods</div>
                    <div class="info-value">${(session.settings?.methods || []).join(', ') || 'N/A'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Tested Categories</div>
                    <div class="info-value" style="font-size: 12px; word-break: break-word;">${(session.settings?.categories || []).join(', ') || 'All'}</div>
                </div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-top: 20px;">
                ${[
                    { label: 'Follow Redirects', key: 'followRedirect' },
                    { label: 'False Positive Test', key: 'falsePositiveTest' },
                    { label: 'Case Sensitive', key: 'caseSensitiveTest' },
                    { label: 'Enhanced Payloads', key: 'enhancedPayloads' },
                    { label: 'Advanced Payloads', key: 'useAdvancedPayloads' },
                    { label: 'Auto Detect WAF', key: 'autoDetectWAF' },
                    { label: 'Encoding Variations', key: 'useEncodingVariations' },
                    { label: 'HTTP Manipulation', key: 'httpManipulation' },
                ].map(opt => {
                    const val = session.settings?.[opt.key];
                    const isOn = !!val;
                    return `<div style="display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: ${isOn ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.1)'}; border: 1px solid ${isOn ? 'rgba(16, 185, 129, 0.25)' : 'rgba(100, 116, 139, 0.15)'}; border-radius: 8px;">
                        <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${isOn ? '#10b981' : '#475569'};"></span>
                        <span style="font-size: 13px; color: ${isOn ? '#e5e7eb' : '#64748b'};">${opt.label}</span>
                        <span style="margin-left: auto; font-size: 12px; font-weight: 700; color: ${isOn ? '#10b981' : '#64748b'};">${isOn ? 'ON' : 'OFF'}</span>
                    </div>`;
                }).join('')}
            </div>
        </div>

        <div class="card">
            <h2 class="card-title">📋 Vulnerability Assessment</h2>
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Severity</th>
                            <th>Score</th>
                            <th>${falsePositiveMode ? 'FP Rate' : 'Bypass Rate'}</th>
                            <th>Tests (${falsePositiveMode ? 'False Pos.' : 'Bypassed'}/Total)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${vulnerabilityScores
													.map(
														(vuln) => `
                        <tr>
                            <td><strong>${escapeHtml(vuln.category)}</strong></td>
                            <td><span class="severity-badge severity-${vuln.severity.toLowerCase()}">${vuln.severity}</span></td>
                            <td>${vuln.score}/100</td>
                            <td style="color: ${vuln.bypassRate > 50 ? '#f43f5e' : vuln.bypassRate > 20 ? '#f59e0b' : '#10b981'}; font-weight: 700;">${vuln.bypassRate}%</td>
                            <td>${vuln.bypassedCount}/${vuln.totalCount}</td>
                        </tr>
                        `,
													)
													.join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <div class="card">
            <h2 class="card-title">💡 Recommendations</h2>
            <div class="recommendations">
                <ol>
                    ${executiveSummary.recommendations.map((rec) => `<li>${escapeHtml(rec)}</li>`).join('')}
                </ol>
            </div>
        </div>

        <div class="card results-section">
            <h2 class="card-title">📝 Detailed Test Results</h2>
            <p style="color: #9ca3af; margin-bottom: 20px; font-size: 14px;">
                Complete list of all ${session.results.length} test requests executed during the security assessment.
            </p>
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th style="width: 20%;">Category</th>
                            <th style="width: 10%;">Method</th>
                            <th style="width: 10%;">Status</th>
                            <th style="width: 10%;">Time</th>
                            <th style="width: 50%;">Payload</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${session.results
													.map((result) => {
														const statusStr = String(result.status);
														const bgColor = getStatusColor(statusStr, falsePositiveMode);
														const borderColor = getStatusBorderColor(statusStr, falsePositiveMode);
														const statusClass =
															statusStr === '403'
																? 'text-cyber-success'
																: statusStr === '200' || statusStr === '201' || statusStr === '204'
																	? 'text-cyber-danger'
																	: 'text-orange-400';
														return `
                        <tr class="result-row" style="background-color: ${bgColor}; border-left-color: ${borderColor};">
                            <td><strong>${escapeHtml(result.category || 'N/A')}</strong></td>
                            <td style="font-family: 'JetBrains Mono', monospace; color: #f05627;">${escapeHtml(result.method || 'N/A')}</td>
                            <td><span class="status-code" style="color: ${statusClass === 'text-cyber-success' ? '#10b981' : statusClass === 'text-cyber-danger' ? '#f43f5e' : '#f59e0b'};">${escapeHtml(statusStr)}</span></td>
                            <td style="color: ${(result.responseTime || 0) >= 2000 ? '#f59e0b' : '#94a3b8'}; font-weight: ${(result.responseTime || 0) >= 2000 ? '700' : '400'};">${result.responseTime || 0}ms${(result.responseTime || 0) >= 2000 ? ' <span style="background: rgba(245,158,11,0.15); color: #f59e0b; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700;">SLOW</span>' : ''}</td>
                            <td><span class="payload">${escapeHtml(result.payload || 'N/A')}</span></td>
                        </tr>
                        `;
													})
													.join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <div class="footer">
            <p>Generated by WAFinity by <a href="https://mickaelasseline.com" style="color: #f05627; text-decoration: none;">Mickael Asseline</a> • ${new Date().toLocaleString()}</p>
        </div>
    </div>
</body>
</html>
    `;
}

function generateVulnerabilityScores(results, falsePositiveMode = false) {
	const categoryStats = new Map();

	results.forEach((result) => {
		const category = result.category;
		const stats = categoryStats.get(category) || { total: 0, bypassed: 0 };
		stats.total++;

		const s = parseInt(String(result.status), 10);
		const isErr = isNaN(s) || result.status === 'ERR' || result.status === 'Error';
		const isBypassed = falsePositiveMode
			? (s === 403 || s === 406 || s === 429 || s === 444 || (s >= 500 && s < 600) || isErr)
			: ((s >= 200 && s < 300) || (s >= 500 && s < 600) || isErr);

		if (isBypassed) {
			stats.bypassed++;
		}

		categoryStats.set(category, stats);
	});

	const scores = [];
	categoryStats.forEach((stats, category) => {
		const bypassRate = stats.total > 0 ? (stats.bypassed / stats.total) * 100 : 0;

		let severity, score;
		if (bypassRate >= 75) {
			severity = 'Critical';
			score = 90 + ((bypassRate - 75) / 25) * 10;
		} else if (bypassRate >= 50) {
			severity = 'High';
			score = 70 + ((bypassRate - 50) / 25) * 20;
		} else if (bypassRate >= 25) {
			severity = 'Medium';
			score = 40 + ((bypassRate - 25) / 25) * 30;
		} else {
			severity = 'Low';
			score = (bypassRate / 25) * 40;
		}

		scores.push({
			category,
			severity,
			score: Math.round(score),
			bypassedCount: stats.bypassed,
			totalCount: stats.total,
			bypassRate: Math.round(bypassRate * 100) / 100,
		});
	});

	return scores.sort((a, b) => b.score - a.score);
}

function generateExecutiveSummary(results, vulnerabilityScores, wafDetection, falsePositiveMode = false) {
	const totalTests = results.length;
	const bypassedTests = results.filter((r) => {
		const s = parseInt(String(r.status), 10);
		const isErr = isNaN(s) || r.status === 'ERR' || r.status === 'Error';
		if (falsePositiveMode) {
			return s === 403 || s === 406 || s === 429 || s === 444 || (s >= 500 && s < 600) || isErr;
		}
		return (s >= 200 && s < 300) || (s >= 500 && s < 600) || isErr;
	}).length;
	const bypassRate = totalTests > 0 ? (bypassedTests / totalTests) * 100 : 0;
	const wafEffectiveness = Math.max(0, Math.min(100, Math.round(100 - bypassRate)));

	const criticalVulnerabilities = vulnerabilityScores.filter((v) => v.severity === 'Critical').length;
	const highVulnerabilities = vulnerabilityScores.filter((v) => v.severity === 'High').length;
	const mediumVulnerabilities = vulnerabilityScores.filter((v) => v.severity === 'Medium').length;
	const lowVulnerabilities = vulnerabilityScores.filter((v) => v.severity === 'Low').length;

	let riskLevel, overallScore;
	if (falsePositiveMode) {
		if (criticalVulnerabilities > 0 || bypassRate > 30) {
			riskLevel = 'Critical';
			overallScore = 10;
		} else if (highVulnerabilities > 0 || bypassRate > 10) {
			riskLevel = 'High';
			overallScore = 30;
		} else if (mediumVulnerabilities > 0 || bypassRate > 0) {
			riskLevel = 'Medium';
			overallScore = 60;
		} else {
			riskLevel = 'Low';
			overallScore = 90;
		}
	} else {
		if (criticalVulnerabilities > 0 || bypassRate > 40) {
			riskLevel = 'Critical';
			overallScore = 10;
		} else if (highVulnerabilities > 0 || bypassRate > 15) {
			riskLevel = 'High';
			overallScore = 30;
		} else if (mediumVulnerabilities > 0 || bypassRate > 0) {
			riskLevel = 'Medium';
			overallScore = 60;
		} else {
			riskLevel = 'Low';
			overallScore = 90;
		}
	}

	const recommendations = [];
	if (falsePositiveMode) {
		if (bypassRate > 50) {
			recommendations.push('WAF is blocking too much legitimate traffic - review and relax rules');
		}
		if (criticalVulnerabilities > 0) {
			recommendations.push('Critical false positive rate detected - immediate rule review needed');
		}
		vulnerabilityScores.slice(0, 3).forEach((vuln) => {
			if (vuln.severity === 'Critical' || vuln.severity === 'High') {
				recommendations.push(`Review WAF rules for ${vuln.category} - high false positive rate`);
			}
		});
		if (recommendations.length === 0) {
			recommendations.push('WAF has a low false positive rate - legitimate traffic flows normally');
		}
	} else {
		if (criticalVulnerabilities > 0) {
			recommendations.push('Immediately review and update WAF rules for critical vulnerabilities');
		}
		if (bypassRate > 50) {
			recommendations.push('WAF configuration needs significant improvement');
		}
		if (!wafDetection?.detected) {
			recommendations.push('Consider implementing a Web Application Firewall');
		}
		vulnerabilityScores.slice(0, 3).forEach((vuln) => {
			if (vuln.severity === 'Critical' || vuln.severity === 'High') {
				recommendations.push(`Strengthen protection against ${vuln.category} attacks`);
			}
		});
		if (recommendations.length === 0) {
			recommendations.push('WAF is performing well, continue monitoring');
		}
	}

	// Response time stats
	let totalTime = 0,
		slowCount = 0,
		minTime = Infinity,
		maxTime = 0;
	for (const r of results) {
		const rt = r.responseTime || 0;
		totalTime += rt;
		if (rt >= SLOW_RESPONSE_THRESHOLD) slowCount++;
		if (rt < minTime) minTime = rt;
		if (rt > maxTime) maxTime = rt;
	}
	if (minTime === Infinity) minTime = 0;
	const avgResponseTime = totalTests > 0 ? Math.round(totalTime / totalTests) : 0;

	return {
		riskLevel,
		wafEffectiveness: Math.round(wafEffectiveness * 100) / 100,
		totalTests,
		bypassedTests,
		overallScore,
		bypassRate: Math.round(bypassRate * 100) / 100,
		criticalVulnerabilities,
		highVulnerabilities,
		mediumVulnerabilities,
		lowVulnerabilities,
		recommendations: recommendations.slice(0, 5),
		responseTimeStats: {
			avgResponseTime,
			minResponseTime: minTime,
			maxResponseTime: maxTime,
			slowRequests: slowCount,
			slowThresholdMs: SLOW_RESPONSE_THRESHOLD,
		},
	};
}


// =============================================
// Export for Recon / Headers / DNS features
// =============================================
function _getReconData(type) {
	if (type === 'headers') return lastSecurityHeadersData;
	if (type === 'dns') return lastDNSReconData;
	if (type === 'recon') return lastFullReconData;
	if (type === 'speed') return lastSpeedTestData;
	if (type === 'seo') return lastSEOData;
	return null;
}

function _getReconLabel(type) {
	if (type === 'headers') return 'security-headers';
	if (type === 'dns') return 'dns-whois';
	if (type === 'recon') return 'full-recon';
	if (type === 'speed') return 'speed-test';
	if (type === 'seo') return 'seo-audit';
	return 'export';
}

function exportReconJSON(type) {
	const data = _getReconData(type);
	if (!data) {
		showAlert('No data to export. Run the scan first.', 'Warning', 'warning');
		return;
	}
	const label = _getReconLabel(type);
	const hostname = data.hostname || data.url || 'unknown';
	const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
	const exportData = { exportedAt: new Date().toISOString(), tool: 'WAFinity', type: label, ...data };
	const content = JSON.stringify(exportData, null, 2);
	const hname = hostname.replace(/^https?:\/\//, '').replace(/[^a-zA-Z0-9.-]/g, '_');
	downloadFile(content, `${label}_${hname}_${timestamp}.json`, 'application/json');
}

function exportReconHTML(type) {
	const data = _getReconData(type);
	if (!data) {
		showAlert('No data to export. Run the scan first.', 'Warning', 'warning');
		return;
	}

	const resultsDiv = document.getElementById('results');
	if (!resultsDiv) return;

	const label = _getReconLabel(type);
	const titleMap = { headers: 'Security Headers Audit', recon: 'Full Reconnaissance' };
	const title = titleMap[type] || label;
	const hostname = data.hostname || data.url || 'unknown';
	const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
	const hname = hostname.replace(/^https?:\/\//, '').replace(/[^a-zA-Z0-9.-]/g, '_');
	const now = new Date();
	const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
	const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

	// Clone results and clean up for export
	const cloneDiv = resultsDiv.cloneNode(true);
	// Remove export buttons from clone
	cloneDiv.querySelectorAll('button').forEach((btn) => {
		const txt = btn.textContent || '';
		if (txt.includes('JSON') || txt.includes('HTML') || btn.title === 'Screenshot') btn.remove();
	});
	// Open all <details> elements
	cloneDiv.querySelectorAll('details').forEach((d) => d.setAttribute('open', ''));
	// Remove max-height constraints so all content is visible
	cloneDiv.querySelectorAll('[class*="max-h-"]').forEach((el) => {
		el.style.maxHeight = 'none';
		el.style.overflow = 'visible';
	});
	// Remove tooltip icons
	cloneDiv.querySelectorAll('.recon-tip').forEach((el) => el.remove());

	// Collect all inline <style> blocks and the Tailwind CSS
	let inlineStyles = '';
	for (const el of document.querySelectorAll('style')) {
		inlineStyles += el.textContent + '\n';
	}
	// Try to grab the Tailwind CSS (loaded via <link>)
	let tailwindCSS = '';
	for (const link of document.querySelectorAll('link[rel="stylesheet"]')) {
		try {
			const sheet = link.sheet;
			if (sheet) {
				const rules = Array.from(sheet.cssRules)
					.map((r) => r.cssText)
					.join('\n');
				tailwindCSS += rules + '\n';
			}
		} catch (e) {
			// CORS — skip external sheets that can't be read
		}
	}

	const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)} — ${escapeHtml(hostname)} — WAFinity</title>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
    <style>
        /* Tailwind + App styles */
        ${tailwindCSS}
        ${inlineStyles}

        /* Report overrides */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Outfit', system-ui, -apple-system, sans-serif;
            background: #090d16;
            color: #e5e7eb;
            padding: 40px 20px;
            line-height: 1.6;
        }
        .report-container { max-width: 1200px; margin: 0 auto; }
        .report-header {
            background: #151c2e;
            border: 1px solid rgba(56, 189, 248, 0.2);
            border-radius: 16px;
            padding: 40px;
            margin-bottom: 30px;
            text-align: center;
        }
        .report-header h1 { font-size: 28px; font-weight: 700; color: #f05627;
            margin-bottom: 8px; }
        .report-header .subtitle { font-size: 14px; color: #9ca3af; margin-bottom: 20px; }
        .report-header-info {
            display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px; margin-top: 25px; text-align: left;
        }
        .report-info-item {
            background: #1c2438; padding: 12px; border-radius: 8px;
            border: 1px solid rgba(240, 86, 39, 0.15);
        }
        .report-info-label { font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .report-info-value { font-size: 13px; color: #ffffff; font-weight: 500; font-family: 'JetBrains Mono', monospace; word-break: break-all; }
        .report-footer {
            margin-top: 40px; padding-top: 20px;
            border-top: 1px solid rgba(148, 163, 184, 0.15);
            text-align: center; font-size: 12px; color: #6b7280;
        }
        /* Ensure all content visible in report */
        [class*="max-h-"] { max-height: none !important; overflow: visible !important; }
        details[open] summary ~ * { display: block; }
        details { border-radius: 12px; overflow: visible; margin-bottom: 16px; }
        .cyber-loader, .cyber-loader-inline, .recon-tip { display: none !important; }
        a { color: #f05627; text-decoration: none; }
        a:hover { text-decoration: underline; }
        img { max-width: 100%; height: auto; }
        code { font-family: 'JetBrains Mono', monospace; }
    </style>
</head>
<body>
    <div class="report-container">
        <div class="report-header">
            <h1>${escapeHtml(title)}</h1>
            <div class="subtitle">WAFinity &mdash; Security Assessment Report</div>
            <div class="report-header-info">
                <div class="report-info-item">
                    <div class="report-info-label">Target</div>
                    <div class="report-info-value">${escapeHtml(hostname)}</div>
                </div>
                <div class="report-info-item">
                    <div class="report-info-label">Date</div>
                    <div class="report-info-value">${dateStr}</div>
                </div>
                <div class="report-info-item">
                    <div class="report-info-label">Time</div>
                    <div class="report-info-value">${timeStr}</div>
                </div>
                ${data.responseTime ? `<div class="report-info-item"><div class="report-info-label">Response Time</div><div class="report-info-value">${data.responseTime}ms</div></div>` : ''}
                ${data.grade ? `<div class="report-info-item"><div class="report-info-label">Security Grade</div><div class="report-info-value" style="font-size:24px;font-weight:700;color:${data.score >= 80 ? '#10b981' : data.score >= 50 ? '#f59e0b' : '#f43f5e'}">${data.grade}</div></div>` : ''}
            </div>
        </div>
        <div style="margin-top:30px;">
            ${cloneDiv.innerHTML}
        </div>
        <div class="report-footer">WAFinity by Mickael Asseline &mdash; ${dateStr} at ${timeStr}</div>
    </div>
</body>
</html>`;
	downloadFile(html, `${label}_${hname}_${timestamp}.html`, 'text/html');
	showAlert('HTML report downloaded successfully.', 'Export', 'success');
}

async function exportReconScreenshot(event) {
	const content = document.getElementById('results');
	if (!content || !content.innerHTML.trim()) {
		showAlert('No results to capture.', 'Warning', 'warning');
		return;
	}

	let btn = null;
	let oldText = '';

	try {
		// Show loading state on button
		if (event && event.target) {
			btn = event.target.closest('button');
			if (btn) {
				oldText = btn.innerHTML;
				btn.innerHTML = cyberLoader({ size: 'sm', text: 'Capturing...', inline: true });
				btn.disabled = true;
			}
		}

		// Ensure html2canvas is loaded
		if (typeof html2canvas === 'undefined') {
			const script = document.createElement('script');
			script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
			document.head.appendChild(script);
			await new Promise((resolve, reject) => {
				script.onload = resolve;
				script.onerror = reject;
			});
		}

		await new Promise((resolve) => setTimeout(resolve, 300));

		// Clone content first and prepare it
		const clone = content.cloneNode(true);

		// Remove export buttons from clone
		clone.querySelectorAll('button').forEach((b) => {
			const txt = b.textContent || '';
			if (txt.includes('JSON') || txt.includes('HTML') || b.title === 'Screenshot') b.remove();
		});

		// Expand all scrollable containers (max-h-*) so nothing is clipped
		clone.querySelectorAll('[class*="max-h-"]').forEach((el) => {
			el.style.maxHeight = 'none';
			el.style.overflow = 'visible';
		});

		// Open all <details> elements
		clone.querySelectorAll('details').forEach((d) => d.setAttribute('open', ''));

		// Remove overflow-hidden that clips content
		clone.querySelectorAll('.overflow-hidden').forEach((el) => {
			el.style.overflow = 'visible';
		});

		// Remove tooltip icons (not useful in screenshot)
		clone.querySelectorAll('.recon-tip').forEach((el) => el.remove());

		// Create a temporary measuring container to find the real needed width
		const measurer = document.createElement('div');
		measurer.style.cssText = `
			position: fixed; left: 0; top: 0; visibility: hidden; z-index: -9999;
			width: auto; min-width: 1200px; max-width: none;
			padding: 40px;
			font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		`;
		measurer.appendChild(clone.cloneNode(true));
		document.body.appendChild(measurer);
		await new Promise((r) => setTimeout(r, 200));
		const measuredWidth = Math.max(measurer.scrollWidth, 1200);
		document.body.removeChild(measurer);

		// Create wrapper with the correct measured width
		const wrapper = document.createElement('div');
		wrapper.style.cssText = `
			background: #090d16;
			padding: 40px;
			width: ${measuredWidth + 80}px;
			position: fixed;
			left: 0;
			top: 0;
			visibility: hidden;
			font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			z-index: -9999;
		`;

		// Add header
		const header = document.createElement('div');
		const now = new Date();
		const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
		const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
		header.innerHTML = `
			<div style="display: flex; align-items: center; gap: 15px; margin-bottom: 25px; padding-bottom: 20px; border-bottom: 2px solid rgba(240, 86, 39, 0.2);">
				<div style="width: 50px; height: 50px; background: rgba(240, 86, 39, 0.15); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
					<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f05627" stroke-width="2">
						<path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
					</svg>
				</div>
				<div>
					<div style="font-size: 22px; font-weight: bold; color: white; font-family: system-ui, -apple-system, sans-serif; margin-bottom: 4px;">WAFinity</div>
					<div style="font-size: 13px; color: #9ca3af; font-family: system-ui, -apple-system, sans-serif;">Generated by WAFinity &bull; ${dateStr} at ${timeStr}</div>
				</div>
			</div>
		`;
		wrapper.appendChild(header);

		// Set clone width
		clone.style.cssText = `max-width: 100%; width: ${measuredWidth}px; margin: 0 auto;`;
		wrapper.appendChild(clone);

		// Footer
		const footer = document.createElement('div');
		footer.innerHTML = `
			<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(148, 163, 184, 0.15); text-align: center;">
				<span style="font-size: 12px; color: #6b7280; font-family: system-ui, -apple-system, sans-serif;">WAFinity by Mickael Asseline</span>
			</div>
		`;
		wrapper.appendChild(footer);

		document.body.appendChild(wrapper);

		// Wait for layout to settle and images to load
		await new Promise((resolve) => setTimeout(resolve, 800));

		// Make wrapper visible for capture
		wrapper.style.visibility = 'visible';
		wrapper.style.position = 'fixed';
		wrapper.style.left = '0';
		wrapper.style.top = '0';

		// Force reflow
		const height = wrapper.offsetHeight;
		const width = wrapper.offsetWidth;

		// Capture the wrapper
		const canvas = await html2canvas(wrapper, {
			backgroundColor: '#090d16',
			scale: 2,
			useCORS: true,
			logging: false,
			allowTaint: true,
			width: width,
			height: height,
			foreignObjectRendering: false,
			onclone: (clonedDoc) => {
				const clonedWrapper = clonedDoc.body.querySelector('div');
				if (clonedWrapper) {
					clonedWrapper.style.position = 'relative';
					clonedWrapper.style.left = '0';
					clonedWrapper.style.top = '0';
					clonedWrapper.style.visibility = 'visible';
				}
				// Ensure all scrollable areas are expanded in the html2canvas clone too
				clonedDoc.querySelectorAll('[class*="max-h-"]').forEach((el) => {
					el.style.maxHeight = 'none';
					el.style.overflow = 'visible';
				});
				clonedDoc.querySelectorAll('.overflow-hidden').forEach((el) => {
					el.style.overflow = 'visible';
				});
				clonedDoc.querySelectorAll('details').forEach((d) => d.setAttribute('open', ''));

				// Fix conic-gradient circles for html2canvas (may not support conic-gradient)
				// Replace with simple bordered circles with the value
				clonedDoc.querySelectorAll('[style*="conic-gradient"]').forEach((el) => {
					const innerDiv = el.querySelector('div');
					const span = innerDiv ? innerDiv.querySelector('span') : el.querySelector('span');
					const color = span ? span.style.color || '#10b981' : '#10b981';
					const val = span ? span.textContent.trim() : '';
					el.style.cssText = `width:56px;height:56px;border-radius:50%;border:3px solid ${color};display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.3);margin:0 auto;`;
					el.innerHTML = `<span style="font-size:15px;font-weight:800;color:${color};font-family:system-ui,sans-serif">${val}</span>`;
				});
			},
		});

		document.body.removeChild(wrapper);

		// Convert to blob and download + clipboard
		canvas.toBlob(async (blob) => {
			if (!blob) {
				throw new Error('Failed to create blob from canvas');
			}

			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			const ts = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
			let hname = 'scan';
			try {
				hname = new URL(document.getElementById('url')?.value || '').hostname.replace(/[^a-zA-Z0-9.-]/g, '_');
			} catch {}
			link.download = `waf-scan_${hname}_${ts}.png`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);

			// Try clipboard copy
			let clipboardSuccess = false;
			try {
				if (typeof ClipboardItem !== 'undefined' && navigator.clipboard && navigator.clipboard.write) {
					const clipboardItem = new ClipboardItem({ 'image/png': Promise.resolve(blob) });
					await navigator.clipboard.write([clipboardItem]);
					clipboardSuccess = true;
				}
			} catch (clipErr) {
				console.warn('Clipboard copy failed:', clipErr);
			}

			if (btn) {
				btn.innerHTML = oldText;
				btn.disabled = false;
			}

			if (clipboardSuccess) {
				showAlert('Screenshot exported and copied to clipboard!', 'Export', 'success');
			} else {
				showAlert('Screenshot exported successfully!', 'Export', 'success');
			}
		}, 'image/png');
	} catch (error) {
		console.error('Screenshot export failed:', error);
		showAlert(`Failed to export screenshot: ${error.message}`, 'Error', 'error');
		if (btn) {
			btn.innerHTML = oldText;
			btn.disabled = false;
		}
	}
}

// Batch Testing Functions

// Expose to window for global access
window.showExportControls = showExportControls;
window.hideExportControls = hideExportControls;
window.exportResults = exportResults;
window.exportAsJSON = exportAsJSON;
window.exportAsCSV = exportAsCSV;
window.exportAsHTMLReport = exportAsHTMLReport;
window.generateHTMLReport = generateHTMLReport;
window.generateVulnerabilityScores = generateVulnerabilityScores;
window.generateExecutiveSummary = generateExecutiveSummary;
window.exportReconJSON = exportReconJSON;
window.exportReconHTML = exportReconHTML;
window.exportReconScreenshot = exportReconScreenshot;
