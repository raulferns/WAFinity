// Payload data is loaded at runtime from GitHub to avoid WAF blocking during deployment
// See: data/payloads.json in the repository

export type PayloadCategory = {
	type: 'ParamCheck' | 'FileCheck' | 'Header';
	payloads: string[];
	falsePayloads: string[];
};

// These objects are populated at runtime from GitHub
export const PAYLOADS: Record<string, PayloadCategory> = {};
export const ENHANCED_PAYLOADS: Record<string, PayloadCategory> = {};
