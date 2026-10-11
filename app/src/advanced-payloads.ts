// Advanced payload data is loaded at runtime from GitHub to avoid WAF blocking during deployment
// See: data/payloads.json in the repository

import { PayloadCategory } from './payloads';
import { PayloadEncoder, WAFBypasses } from './encoding';

// Populated at runtime from GitHub
export const ADVANCED_PAYLOADS: Record<string, PayloadCategory> = {};

/**
 * Generate dynamic bypass payloads using encoding techniques
 */
export function generateEncodedPayloads(originalPayloads: Record<string, PayloadCategory>): Record<string, PayloadCategory> {
	const encodedPayloads: Record<string, PayloadCategory> = {};

	for (const [categoryName, category] of Object.entries(originalPayloads)) {
		const encodedCategory: PayloadCategory = {
			type: category.type,
			payloads: [],
			falsePayloads: category.falsePayloads || [],
		};

		// Generate encoded variations for each payload
		for (const payload of category.payloads) {
			const variations = PayloadEncoder.generateBypassVariations(payload, categoryName);
			encodedCategory.payloads.push(...variations);
		}

		// Remove duplicates
		encodedCategory.payloads = [...new Set(encodedCategory.payloads)];

		encodedPayloads[`${categoryName} - Encoded`] = encodedCategory;
	}

	return encodedPayloads;
}

/**
 * WAF-specific bypass payload generator
 */
export function generateWAFSpecificPayloads(wafType: string, basePayload: string): string[] {
	switch (wafType.toLowerCase()) {
		case 'cloudflare':
			return WAFBypasses.cloudflareBypass(basePayload);
		case 'aws':
		case 'awswaf':
			return WAFBypasses.awsWafBypass(basePayload);
		case 'modsecurity':
			return WAFBypasses.modSecurityBypass(basePayload);
		default:
			return PayloadEncoder.generateBypassVariations(basePayload);
	}
}

/**
 * Generate HTTP manipulation specific payloads
 */
export function generateHTTPManipulationPayloads(
	basePayload: string,
	technique: 'verb' | 'pollution' | 'content-type' | 'smuggling' = 'pollution',
): string[] {
	const variations = [basePayload];

	switch (technique) {
		case 'pollution':
			variations.push(`param=${encodeURIComponent(basePayload)}&param=${encodeURIComponent(basePayload)}`);
			variations.push(`param[]=${encodeURIComponent(basePayload)}&param[]=${encodeURIComponent(basePayload)}`);
			variations.push(`param=${encodeURIComponent(basePayload)}&PARAM=${encodeURIComponent(basePayload)}`);
			break;

		case 'content-type':
			variations.push(`{"payload": "${basePayload.replace(/"/g, '\\"')}"}`);
			variations.push(
				`<?xml version="1.0"?><payload>${basePayload.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</payload>`,
			);
			variations.push(`payload=${encodeURIComponent(basePayload)}`);
			break;

		case 'smuggling':
			variations.push(`0\r\n\r\n${basePayload}`);
			variations.push(`${basePayload.length.toString(16)}\r\n${basePayload}\r\n0\r\n\r\n`);
			break;
	}

	return [...new Set(variations)];
}
