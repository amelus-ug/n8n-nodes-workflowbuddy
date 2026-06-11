// Local mock of the WorkflowBuddy companion API (https://companion.amelus.de).
//
// The production endpoint is not deployed yet, so all development and testing
// runs against this mock. It implements the documented contract:
//
//   POST /api/notify
//   Authorization: Bearer wb_<64 hex>
//   { "title": string (<=120, required),
//     "message": string (<=1000, required),
//     "severity": "info" | "warning" | "critical" (optional, default "info") }
//
//   200 {ok:true} | 400 validation | 401 bad key | 429 rate limit | 502/503 APNs
//
// Authentication is checked BEFORE the payload — the credential test in
// WorkflowBuddyApi.credentials.ts relies on this ordering (empty body + valid
// key => 400, invalid key => 401).
//
// Standalone usage (e.g. to test the node in a local n8n instance):
//
//   node test/mock-server.mjs [port]   # default port 3933
//
// Special API keys trigger specific responses:
//   wb_aaa…  -> 200 (valid key)
//   wb_bbb…  -> 429 rate limit
//   wb_ccc…  -> 502 APNs error
//   wb_ddd…  -> 503 APNs unavailable

import { createServer } from 'node:http';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

export const VALID_KEY = 'wb_' + 'a'.repeat(64);
export const RATE_LIMITED_KEY = 'wb_' + 'b'.repeat(64);
export const APNS_ERROR_KEY = 'wb_' + 'c'.repeat(64);
export const APNS_UNAVAILABLE_KEY = 'wb_' + 'd'.repeat(64);

const KNOWN_KEYS = new Set([VALID_KEY, RATE_LIMITED_KEY, APNS_ERROR_KEY, APNS_UNAVAILABLE_KEY]);

const SEVERITIES = new Set(['info', 'warning', 'critical']);

function validatePayload(payload) {
	if (typeof payload !== 'object' || payload === null) {
		return 'Request body must be a JSON object';
	}
	const { title, message, severity } = payload;
	if (typeof title !== 'string' || title.length === 0) {
		return 'title is required and must be a non-empty string';
	}
	if (title.length > 120) {
		return 'title must be at most 120 characters';
	}
	if (typeof message !== 'string' || message.length === 0) {
		return 'message is required and must be a non-empty string';
	}
	if (message.length > 1000) {
		return 'message must be at most 1000 characters';
	}
	if (severity !== undefined && !SEVERITIES.has(severity)) {
		return 'severity must be one of: info, warning, critical';
	}
	return null;
}

export function createMockServer({ log = false } = {}) {
	return createServer((req, res) => {
		const chunks = [];
		req.on('data', (chunk) => chunks.push(chunk));
		req.on('end', () => {
			const rawBody = Buffer.concat(chunks).toString('utf8');
			const { statusCode, body, headers } = handleRequest(req, rawBody);
			if (log) {
				console.log(`${req.method} ${req.url} -> ${statusCode} ${JSON.stringify(body)}`);
			}
			res.writeHead(statusCode, { 'Content-Type': 'application/json', ...headers });
			res.end(JSON.stringify(body));
		});
	});
}

function handleRequest(req, rawBody) {
	if (req.method !== 'POST' || req.url !== '/api/notify') {
		return { statusCode: 404, body: { ok: false, error: 'Not found' } };
	}

	// Authentication comes first — the credential test depends on this ordering.
	const auth = req.headers.authorization ?? '';
	const match = /^Bearer (wb_[0-9a-f]{64})$/.exec(auth);
	if (!match || !KNOWN_KEYS.has(match[1])) {
		return { statusCode: 401, body: { ok: false, error: 'Invalid or revoked API key' } };
	}
	const key = match[1];

	if (key === RATE_LIMITED_KEY) {
		return {
			statusCode: 429,
			body: { ok: false, error: 'Rate limit exceeded' },
			headers: { 'Retry-After': '60' },
		};
	}
	if (key === APNS_ERROR_KEY) {
		return { statusCode: 502, body: { ok: false, error: 'Failed to deliver via APNs' } };
	}
	if (key === APNS_UNAVAILABLE_KEY) {
		return { statusCode: 503, body: { ok: false, error: 'APNs temporarily unavailable' } };
	}

	let payload;
	try {
		payload = rawBody.length > 0 ? JSON.parse(rawBody) : undefined;
	} catch {
		return { statusCode: 400, body: { ok: false, error: 'Request body must be valid JSON' } };
	}

	const validationError = validatePayload(payload);
	if (validationError) {
		return { statusCode: 400, body: { ok: false, error: validationError } };
	}

	return { statusCode: 200, body: { ok: true } };
}

/** Starts the mock on an ephemeral (or given) port; resolves with its base URL. */
export async function startMockServer({ port = 0, log = false } = {}) {
	const server = createMockServer({ log });
	await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));
	const address = server.address();
	return {
		server,
		port: address.port,
		url: `http://127.0.0.1:${address.port}`,
		close: () => new Promise((resolve) => server.close(resolve)),
	};
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const port = Number(process.argv[2] ?? 3933);
	const { url } = await startMockServer({ port, log: true });
	console.log(`WorkflowBuddy API mock listening on ${url}`);
	console.log(`  valid key:        ${VALID_KEY}`);
	console.log(`  429 rate limit:   ${RATE_LIMITED_KEY}`);
	console.log(`  502 APNs error:   ${APNS_ERROR_KEY}`);
	console.log(`  503 APNs down:    ${APNS_UNAVAILABLE_KEY}`);
}
