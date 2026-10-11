/**
 * WAF-Checker - Custom Payloads Configuration Module
 */

// ===========================================
// TEST CONFIGURATION MODAL
// ===========================================

let testConfigModal = null;
let currentEditingCategory = null;
let customPayloads = {};
let defaultPayloads = {};
let defaultPayloadsLoaded = false;

// Initialize custom payloads from localStorage
function initCustomPayloads() {
	const stored = localStorage.getItem('wafchecker_customPayloads');
	if (stored) {
		try {
			customPayloads = JSON.parse(stored);
		} catch (e) {
			customPayloads = {};
		}
	}
}

// Load default payloads from server
async function loadDefaultPayloads() {
	if (defaultPayloadsLoaded) return;

	try {
		const response = await fetch('/api/payloads');
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		const data = await response.json();
		if (!data || Object.keys(data).length === 0) throw new Error('Empty data');
		defaultPayloads = data;
		defaultPayloadsLoaded = true;

		// Update PAYLOAD_CATEGORIES with any new categories from server
		const serverCategories = Object.keys(defaultPayloads);
		serverCategories.forEach((cat) => {
			if (!PAYLOAD_CATEGORIES.includes(cat)) {
				PAYLOAD_CATEGORIES.push(cat);
			}
		});
	} catch (e) {
		console.error('Failed to load default payloads:', e);
		showAlert(
			'Failed to load payloads from GitHub. Click "Retry" in the Attack Categories panel to try again.',
			'Payload Loading Error',
			'warning',
		);
	}
}

// Show test configuration modal
async function showTestConfigModal() {
	initCustomPayloads();

	// Show modal first with loading state
	if (!testConfigModal) {
		testConfigModal = new bootstrap.Modal(document.getElementById('testConfigModal'));
	}

	testConfigModal.show();

	// Reset mobile navigation to categories list
	const configContainer = document.querySelector('#testConfigModal .modal-body > div');
	if (configContainer) configContainer.classList.remove('config-editing');

	// Show loading state
	const categoryList = document.getElementById('configCategoryList');
	if (categoryList) {
		categoryList.innerHTML = `<div class="py-6">${cyberLoader({ size: 'md', color: 'text-gray-400', text: 'Loading payloads...' })}</div>`;
	}

	// Load default payloads from server
	await loadDefaultPayloads();

	renderConfigCategoryList();
	showEditorEmpty();
	updateCustomCount();
}

// Render category list in sidebar
function renderConfigCategoryList() {
	const container = document.getElementById('configCategoryList');
	if (!container) return;

	// Combine default payloads, PAYLOAD_CATEGORIES and custom categories
	const allCategories = new Set([...Object.keys(defaultPayloads), ...PAYLOAD_CATEGORIES, ...Object.keys(customPayloads)]);

	let html = '';
	allCategories.forEach((cat) => {
		const hasDefault = defaultPayloads[cat] !== undefined;
		const isCustom = customPayloads[cat] !== undefined;
		const isDeleted = isCustom && customPayloads[cat]?._deleted;
		const isModified = isCustom && hasDefault && !isDeleted;
		const isNew = isCustom && !hasDefault;

		// Count payloads
		let payloadCount = 0;
		if (isCustom && !isDeleted) {
			payloadCount = (customPayloads[cat].payloads?.length || 0) + (customPayloads[cat].falsePayloads?.length || 0);
		} else if (hasDefault && !isDeleted) {
			payloadCount = (defaultPayloads[cat].payloads?.length || 0) + (defaultPayloads[cat].falsePayloads?.length || 0);
		}

		let badge = '';
		if (isDeleted) {
			badge = '<span class="ml-auto px-1.5 py-0.5 text-[10px] bg-cyber-danger/20 text-cyber-danger rounded">DEL</span>';
		} else if (isNew) {
			badge = '<span class="ml-auto px-1.5 py-0.5 text-[10px] bg-cyber-success/20 text-cyber-success rounded">NEW</span>';
		} else if (isModified) {
			badge = '<span class="ml-auto px-1.5 py-0.5 text-[10px] bg-cyber-warning/20 text-cyber-warning rounded">MOD</span>';
		} else {
			badge = `<span class="ml-auto px-1.5 py-0.5 text-[10px] bg-gray-600/50 text-gray-400 rounded">${payloadCount}</span>`;
		}

		const isActive = currentEditingCategory === cat;
		html += `
			<button type="button" onclick="selectCategory('${escapeHtml(cat)}')"
					class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-all ${isActive ? 'bg-cyber-accent/20 text-cyber-accent border border-cyber-accent/50' : 'text-gray-300 hover:bg-cyber-elevated hover:text-white'}">
				<span class="truncate flex-1">${escapeHtml(cat)}</span>
				${badge}
			</button>
		`;
	});

	container.innerHTML = html;
}

// Show empty editor state
function showEditorEmpty() {
	currentEditingCategory = null;
	document.getElementById('configEditorEmpty').style.display = 'flex';
	document.getElementById('configEditor').style.display = 'none';
	// Mobile: go back to categories list
	const container = document.querySelector('#testConfigModal .modal-body > div');
	if (container) container.classList.remove('config-editing');
}

// Switch between Attack and False Positive payload tabs
function switchPayloadTab(tab) {
	const tabAttack = document.getElementById('tabAttackPayloads');
	const tabFalse = document.getElementById('tabFalsePayloads');
	const panelAttack = document.getElementById('panelAttackPayloads');
	const panelFalse = document.getElementById('panelFalsePayloads');

	if (!tabAttack || !tabFalse || !panelAttack || !panelFalse) return;

	if (tab === 'attack') {
		tabAttack.classList.add('border-cyber-accent', 'text-cyber-accent');
		tabAttack.classList.remove('border-transparent', 'text-gray-400');
		tabFalse.classList.remove('border-cyber-accent', 'text-cyber-accent');
		tabFalse.classList.add('border-transparent', 'text-gray-400');
		panelAttack.style.display = 'flex';
		panelFalse.style.display = 'none';
	} else {
		tabFalse.classList.add('border-cyber-accent', 'text-cyber-accent');
		tabFalse.classList.remove('border-transparent', 'text-gray-400');
		tabAttack.classList.remove('border-cyber-accent', 'text-cyber-accent');
		tabAttack.classList.add('border-transparent', 'text-gray-400');
		panelAttack.style.display = 'none';
		panelFalse.style.display = 'flex';
	}
}

// Update payload counts in tabs
function updatePayloadCounts(attackCount, falseCount) {
	const attackCountEl = document.getElementById('attackPayloadCount');
	const falseCountEl = document.getElementById('falsePayloadCount');

	if (attackCountEl) attackCountEl.textContent = attackCount;
	if (falseCountEl) falseCountEl.textContent = falseCount;
}

// Select and edit a category
function selectCategory(categoryName, activeTab = 'attack') {
	currentEditingCategory = categoryName;

	document.getElementById('configEditorEmpty').style.display = 'none';
	document.getElementById('configEditor').style.display = 'flex';

	// Mobile: switch to editor screen
	const container = document.querySelector('#testConfigModal .modal-body > div');
	if (container) container.classList.add('config-editing');

	// Update category name input
	document.getElementById('configCategoryName').value = categoryName;

	// Update badge
	const badge = document.getElementById('configCategoryBadge');
	const resetBtn = document.getElementById('configResetBtn');
	const deleteBtn = document.getElementById('configDeleteBtn');

	const hasDefault = defaultPayloads[categoryName] !== undefined;
	const isCustom = customPayloads[categoryName] !== undefined;

	if (isCustom && customPayloads[categoryName]?._deleted) {
		badge.textContent = 'Deleted';
		badge.className = 'px-2 py-0.5 text-xs rounded-full bg-cyber-danger/20 text-cyber-danger';
		resetBtn.style.display = '';
		deleteBtn.style.display = 'none';
	} else if (isCustom && hasDefault) {
		badge.textContent = 'Modified';
		badge.className = 'px-2 py-0.5 text-xs rounded-full bg-cyber-warning/20 text-cyber-warning';
		resetBtn.style.display = '';
		deleteBtn.style.display = '';
	} else if (isCustom) {
		badge.textContent = 'Custom';
		badge.className = 'px-2 py-0.5 text-xs rounded-full bg-cyber-success/20 text-cyber-success';
		resetBtn.style.display = 'none';
		deleteBtn.style.display = '';
	} else {
		badge.textContent = 'Default';
		badge.className = 'px-2 py-0.5 text-xs rounded-full bg-cyber-accent/20 text-cyber-accent';
		resetBtn.style.display = 'none';
		deleteBtn.style.display = '';
	}

	// Get payloads - prioritize custom, fallback to default
	let attackPayloads = [];
	let falsePayloads = [];

	if (isCustom) {
		// Use custom payloads if they exist
		attackPayloads = customPayloads[categoryName].payloads || [];
		falsePayloads = customPayloads[categoryName].falsePayloads || [];
	} else if (hasDefault) {
		// Use default payloads from server
		attackPayloads = defaultPayloads[categoryName].payloads || [];
		falsePayloads = defaultPayloads[categoryName].falsePayloads || [];
	}

	// All payloads are now editable
	renderPayloadList('configAttackPayloads', attackPayloads, 'attack', !isCustom);
	renderPayloadList('configFalsePayloads', falsePayloads, 'false', !isCustom);

	// Update payload counts in tabs
	updatePayloadCounts(attackPayloads.length, falsePayloads.length);

	// Switch to the specified tab (default: attack)
	switchPayloadTab(activeTab);

	// Update sidebar selection
	renderConfigCategoryList();
}

// Render payload list - all payloads are now editable
function renderPayloadList(containerId, payloads, type, isDefault = false) {
	const container = document.getElementById(containerId);
	if (!container) return;

	if (payloads.length === 0) {
		container.innerHTML = `
			<div class="text-center py-4 text-gray-500 text-sm">
				No ${type === 'attack' ? 'attack' : 'false positive'} payloads defined.
				<br><span class="text-xs">Click "+ Add Payload" to create one.</span>
			</div>
		`;
		return;
	}

	// Check if this category is modified (has custom payloads)
	const isModified = !isDefault;
	const borderClass = isModified ? 'border-cyber-warning/50' : 'border-cyber-accent/20';

	let html = '';

	payloads.forEach((payload, index) => {
		html += `
			<div class="flex items-center gap-2">
				<input type="text" value="${escapeHtml(payload)}"
					   onfocus="enableEditMode('${type}', ${index})"
					   onchange="updatePayloadValue('${type}', ${index}, this.value)"
					   class="flex-1 bg-cyber-elevated border ${borderClass} rounded px-3 py-2 text-sm font-mono text-gray-100 focus:border-cyber-accent focus:ring-1 focus:ring-cyber-accent/30 outline-none" />
				<button type="button" onclick="removePayload('${type}', ${index})"
						class="shrink-0 p-2 text-cyber-danger/60 hover:text-cyber-danger hover:bg-cyber-danger/20 rounded transition-all" title="Remove payload">
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
					</svg>
				</button>
			</div>
		`;
	});

	container.innerHTML = html;
}

// Enable edit mode when clicking on a default payload
function enableEditMode(type, index) {
	if (!currentEditingCategory) return;

	// If this is still showing default payloads, copy to custom first
	if (!customPayloads[currentEditingCategory]) {
		initCustomFromDefault(currentEditingCategory);
		renderConfigCategoryList();
	}
}

// Initialize custom payloads from default if not exists
function initCustomFromDefault(categoryName) {
	if (customPayloads[categoryName]) return; // Already customized

	const defaultData = defaultPayloads[categoryName];
	customPayloads[categoryName] = {
		type: defaultData?.type || 'ParamCheck',
		payloads: defaultData?.payloads ? [...defaultData.payloads] : [],
		falsePayloads: defaultData?.falsePayloads ? [...defaultData.falsePayloads] : [],
	};
}

// Add new payload
function addPayload(type) {
	if (!currentEditingCategory) return;

	// Initialize from default if this is a default category being customized
	initCustomFromDefault(currentEditingCategory);

	const key = type === 'attack' ? 'payloads' : 'falsePayloads';
	if (!customPayloads[currentEditingCategory][key]) {
		customPayloads[currentEditingCategory][key] = [];
	}

	customPayloads[currentEditingCategory][key].push('');
	selectCategory(currentEditingCategory);
	updateCustomCount();
}

// Copy a default payload to custom list for editing
function copyPayloadToCustom(type, payload) {
	if (!currentEditingCategory) return;

	// Initialize from default
	initCustomFromDefault(currentEditingCategory);

	// The payload is already copied when we initialized from default
	// Just refresh the view to show editable state
	selectCategory(currentEditingCategory);
	updateCustomCount();
}

// Update payload value
function updatePayloadValue(type, index, value) {
	if (!currentEditingCategory) return;

	// Copy to custom first if not already
	if (!customPayloads[currentEditingCategory]) {
		initCustomFromDefault(currentEditingCategory);
		renderConfigCategoryList();
	}

	const key = type === 'attack' ? 'payloads' : 'falsePayloads';
	if (customPayloads[currentEditingCategory][key]) {
		customPayloads[currentEditingCategory][key][index] = value;
	}
}

// Remove payload
function removePayload(type, index) {
	if (!currentEditingCategory) return;

	// Copy to custom first if not already
	if (!customPayloads[currentEditingCategory]) {
		initCustomFromDefault(currentEditingCategory);
	}

	const key = type === 'attack' ? 'payloads' : 'falsePayloads';
	if (customPayloads[currentEditingCategory][key]) {
		customPayloads[currentEditingCategory][key].splice(index, 1);
		// Refresh the category but stay on the same tab
		selectCategory(currentEditingCategory, type);
		updateCustomCount();
	}
}

// Add new category
function addNewCategory() {
	const name = prompt('Enter new category name:');
	if (!name || name.trim() === '') return;

	const trimmedName = name.trim();

	// Check if category already exists
	if (defaultPayloads[trimmedName] || customPayloads[trimmedName]) {
		showAlert('A category with this name already exists.', 'Error', 'error');
		return;
	}

	customPayloads[trimmedName] = {
		type: 'ParamCheck',
		payloads: [],
		falsePayloads: [],
	};

	renderConfigCategoryList();
	selectCategory(trimmedName);
	updateCustomCount();
}

// Delete category (works for all categories)
async function deleteCategory() {
	if (!currentEditingCategory) return;

	const hasDefault = defaultPayloads[currentEditingCategory] !== undefined;

	if (hasDefault) {
		const confirmed = await showConfirm(
			`Delete "${currentEditingCategory}"?\n\nThis will hide this default category from tests. You can restore it by resetting all payloads.`,
			'Delete Category',
			'danger',
		);
		if (!confirmed) return;
		// Mark as deleted by setting empty payloads
		customPayloads[currentEditingCategory] = {
			type: defaultPayloads[currentEditingCategory]?.type || 'ParamCheck',
			payloads: [],
			falsePayloads: [],
			_deleted: true,
		};
	} else {
		const confirmed = await showConfirm(`Are you sure you want to delete "${currentEditingCategory}"?`, 'Delete Category', 'danger');
		if (!confirmed) return;
		delete customPayloads[currentEditingCategory];
	}

	renderConfigCategoryList();
	showEditorEmpty();
	updateCustomCount();
}

// Reset category to default
async function resetCategoryToDefault() {
	if (!currentEditingCategory) return;

	const confirmed = await showConfirm(`Reset "${currentEditingCategory}" to default payloads?`, 'Reset Category', 'warning');
	if (!confirmed) return;

	delete customPayloads[currentEditingCategory];
	localStorage.setItem('wafchecker_customPayloads', JSON.stringify(customPayloads));
	renderConfigCategoryList();
	selectCategory(currentEditingCategory);
	updateCustomCount();
}

// Reset ALL payloads to defaults
async function resetAllPayloads() {
	const confirmed = await showConfirm(
		'Reset ALL payloads to defaults?\n\nThis will remove all your customizations, modifications, and custom categories.',
		'Reset All Payloads',
		'danger',
	);
	if (!confirmed) return;

	customPayloads = {};
	localStorage.setItem('wafchecker_customPayloads', JSON.stringify(customPayloads));
	renderConfigCategoryList();
	showEditorEmpty();
	updateCustomCount();
	showAlert('All payloads have been reset to defaults.', 'Success', 'success');
}

// Update custom payload count
function updateCustomCount() {
	const countEl = document.getElementById('configCustomCount');
	if (!countEl) return;

	let total = 0;
	Object.values(customPayloads).forEach((cat) => {
		total += (cat.payloads?.length || 0) + (cat.falsePayloads?.length || 0);
	});

	countEl.textContent = total;
}

// Save test configuration
function saveTestConfig() {
	// Update category name if changed
	if (currentEditingCategory) {
		const newName = document.getElementById('configCategoryName').value.trim();
		if (newName && newName !== currentEditingCategory && customPayloads[currentEditingCategory]) {
			customPayloads[newName] = customPayloads[currentEditingCategory];
			delete customPayloads[currentEditingCategory];
			currentEditingCategory = newName;
		}
	}

	// Clean up empty payloads
	Object.keys(customPayloads).forEach((cat) => {
		if (customPayloads[cat].payloads) {
			customPayloads[cat].payloads = customPayloads[cat].payloads.filter((p) => p.trim() !== '');
		}
		if (customPayloads[cat].falsePayloads) {
			customPayloads[cat].falsePayloads = customPayloads[cat].falsePayloads.filter((p) => p.trim() !== '');
		}

		// Remove category if empty and not a modification
		if (
			!PAYLOAD_CATEGORIES.includes(cat) &&
			(!customPayloads[cat].payloads || customPayloads[cat].payloads.length === 0) &&
			(!customPayloads[cat].falsePayloads || customPayloads[cat].falsePayloads.length === 0)
		) {
			delete customPayloads[cat];
		}
	});

	// Save to localStorage
	localStorage.setItem('wafchecker_customPayloads', JSON.stringify(customPayloads));

	// Update category checkboxes in main UI
	updateCategoryCheckboxesWithCustom();

	// Show success message
	showAlert('Configuration saved successfully!', 'Success', 'success');

	if (testConfigModal) {
		testConfigModal.hide();
	}
}

// Update category checkboxes to include custom categories
function updateCategoryCheckboxesWithCustom() {
	const container = document.getElementById('categoryCheckboxes');
	if (!container) return;

	// Remove loading indicator if present
	const indicator = document.getElementById('payloadLoadingIndicator');
	if (indicator) indicator.remove();

	const payloadCats = window.PAYLOAD_CATEGORIES || (typeof PAYLOAD_CATEGORIES !== 'undefined' ? PAYLOAD_CATEGORIES : []);

	// Get all categories (default + custom)
	const defaultCats = Object.keys(defaultPayloads || {});
	const customCats = Object.keys(customPayloads || {});
	const allCategories = [...new Set([...payloadCats, ...defaultCats, ...customCats])];

	if (allCategories.length === 0) {
		container.innerHTML = '<div class="text-center py-3 text-gray-400">No categories loaded yet...</div>';
		return;
	}

	container.innerHTML = '';
	const defaultChecked = ['SQL Injection', 'XSS'];

	allCategories.forEach((cat, idx) => {
		const id = 'cat_' + idx;
		const hasDefault = (defaultPayloads && defaultPayloads[cat] !== undefined) || payloadCats.includes(cat);
		const isCustom = (customPayloads && customPayloads[cat] !== undefined) && !hasDefault;
		const isModified = (customPayloads && customPayloads[cat] !== undefined) && hasDefault;

		let label = cat;
		if (isCustom) {
			label += ' <span class="text-cyber-success text-[10px]">(custom)</span>';
		} else if (isModified) {
			label += ' <span class="text-cyber-warning text-[10px]">(mod)</span>';
		}

		const div = document.createElement('div');
		div.className = 'form-check';
		div.innerHTML = `<input class="form-check-input w-3.5 h-3.5 accent-cyber-accent cursor-pointer" type="checkbox" value="${cat}" id="${id}"${defaultChecked.includes(cat) ? ' checked' : ''}>
      <label class="form-check-label" for="${id}">${label}</label>`;
		container.appendChild(div);
	});

	// Restore any saved category selections if present
	try {
		const saved = localStorage.getItem('wafchecker_categories');
		if (saved) {
			const arr = JSON.parse(saved);
			if (Array.isArray(arr) && arr.length > 0) {
				const cbs = container.querySelectorAll('input[type=checkbox]');
				cbs.forEach((cb) => {
					cb.checked = arr.includes(cb.value);
				});
			}
		}
	} catch {}
}

// Export custom payloads
function exportCustomPayloads() {
	// Export ALL payloads (defaults merged with customs)
	const allPayloads = {};

	// Start with all default payloads
	for (const [cat, data] of Object.entries(defaultPayloads)) {
		allPayloads[cat] = {
			type: data.type || 'ParamCheck',
			payloads: [...(data.payloads || [])],
			falsePayloads: [...(data.falsePayloads || [])],
		};
	}

	// Override with custom payloads (including deleted ones)
	for (const [cat, data] of Object.entries(customPayloads)) {
		if (data._deleted) {
			// Category was deleted - mark it
			allPayloads[cat] = { ...data };
		} else {
			allPayloads[cat] = {
				type: data.type || 'ParamCheck',
				payloads: [...(data.payloads || [])],
				falsePayloads: [...(data.falsePayloads || [])],
			};
		}
	}

	const exportData = {
		version: '2.0',
		exportedAt: new Date().toISOString(),
		payloads: allPayloads,
	};

	// Convert to YAML
	const yamlStr = jsyaml.dump(exportData, {
		indent: 2,
		lineWidth: -1,
		quotingType: '"',
		forceQuotes: false,
		skipInvalid: false,
	});

	const blob = new Blob([yamlStr], { type: 'text/yaml' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = 'waf-checker-payloads.yaml';
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

// Import custom payloads
function importCustomPayloads() {
	document.getElementById('importPayloadsInput').click();
}

// Handle file import
function handlePayloadsImport(event) {
	const file = event.target.files[0];
	if (!file) return;

	const reader = new FileReader();
	reader.onload = async function (e) {
		try {
			const fileContent = e.target.result;
			const fileName = file.name.toLowerCase();
			let imported;

			// Detect format and parse accordingly
			if (fileName.endsWith('.yaml') || fileName.endsWith('.yml')) {
				// Parse YAML
				if (typeof jsyaml === 'undefined') {
					throw new Error('YAML parser not loaded. Please refresh the page.');
				}
				imported = jsyaml.load(fileContent);
			} else if (fileName.endsWith('.json')) {
				// Parse JSON (backward compatibility)
				imported = JSON.parse(fileContent);
			} else {
				// Try to auto-detect: if it starts with { or [, it's JSON, otherwise try YAML
				const trimmed = fileContent.trim();
				if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
					imported = JSON.parse(fileContent);
				} else {
					if (typeof jsyaml === 'undefined') {
						throw new Error('YAML parser not loaded. Please refresh the page.');
					}
					imported = jsyaml.load(fileContent);
				}
			}

			// Validate structure
			if (typeof imported !== 'object' || imported === null) {
				throw new Error('Invalid format: expected an object');
			}

			// Handle new format (v2.0) with wrapper
			let payloadsData = imported;
			if (imported.version && imported.payloads) {
				payloadsData = imported.payloads;
			}

			// Ask user what to do
			const replaceAll = await showConfirm(
				'Replace all payloads?\n\nOK = Replace all (recommended)\nCancel = Merge with existing',
				'Import Mode',
			);

			if (replaceAll) {
				// Replace mode - clear all custom payloads and import
				customPayloads = {};
			}

			// Import payloads
			Object.keys(payloadsData).forEach((cat) => {
				const data = payloadsData[cat];
				if (data.payloads !== undefined || data.falsePayloads !== undefined) {
					// Check if this differs from default
					const defaultData = defaultPayloads[cat];
					const isDifferentFromDefault =
						!defaultData ||
						JSON.stringify(data.payloads) !== JSON.stringify(defaultData.payloads) ||
						JSON.stringify(data.falsePayloads) !== JSON.stringify(defaultData.falsePayloads) ||
						data._deleted;

					if (isDifferentFromDefault) {
						customPayloads[cat] = {
							type: data.type || 'ParamCheck',
							payloads: data.payloads || [],
							falsePayloads: data.falsePayloads || [],
							...(data._deleted ? { _deleted: true } : {}),
						};
					}
				}
			});

			localStorage.setItem('wafchecker_customPayloads', JSON.stringify(customPayloads));
			renderConfigCategoryList();
			updateCustomCount();
			showEditorEmpty();
			showAlert('Payloads imported successfully!', 'Success', 'success');
		} catch (err) {
			showAlert('Failed to import: Invalid format\n' + err.message, 'Error', 'error');
		}
	};
	reader.readAsText(file);

	// Reset input
	event.target.value = '';
}




// Expose to window for global access
window.initCustomPayloads = initCustomPayloads;
window.loadDefaultPayloads = loadDefaultPayloads;
window.showTestConfigModal = showTestConfigModal;
window.renderConfigCategoryList = renderConfigCategoryList;
window.showEditorEmpty = showEditorEmpty;
window.switchPayloadTab = switchPayloadTab;
window.updatePayloadCounts = updatePayloadCounts;
window.selectCategory = selectCategory;
window.renderPayloadList = renderPayloadList;
window.enableEditMode = enableEditMode;
window.initCustomFromDefault = initCustomFromDefault;
window.addPayload = addPayload;
window.copyPayloadToCustom = copyPayloadToCustom;
window.updatePayloadValue = updatePayloadValue;
window.removePayload = removePayload;
window.addNewCategory = addNewCategory;
window.deleteCategory = deleteCategory;
window.resetCategoryToDefault = resetCategoryToDefault;
window.resetAllPayloads = resetAllPayloads;
window.updateCustomCount = updateCustomCount;
window.saveTestConfig = saveTestConfig;
window.updateCategoryCheckboxesWithCustom = updateCategoryCheckboxesWithCustom;
window.exportCustomPayloads = exportCustomPayloads;
window.importCustomPayloads = importCustomPayloads;
window.handlePayloadsImport = handlePayloadsImport;
