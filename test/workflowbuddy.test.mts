import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { NodeApiError } from 'n8n-workflow';
import type {
	IExecuteSingleFunctions,
	IN8nHttpFullResponse,
	INode,
	INodeExecutionData,
	INodeProperties,
	INodePropertyOptions,
} from 'n8n-workflow';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { WorkflowBuddyApi } from '../credentials/WorkflowBuddyApi.credentials';
import { handleNotifyResponse, WorkflowBuddy } from '../nodes/WorkflowBuddy/WorkflowBuddy.node';
import {
	APNS_ERROR_KEY,
	APNS_UNAVAILABLE_KEY,
	RATE_LIMITED_KEY,
	startMockServer,
	VALID_KEY,
} from './mock-server.mjs';

const node = new WorkflowBuddy();
const credential = new WorkflowBuddyApi();

const findProperty = (name: string): INodeProperties => {
	const property = node.description.properties.find((p) => p.name === name);
	if (!property) throw new Error(`Property ${name} not found on node`);
	return property;
};

const sendOperation = (() => {
	const options = findProperty('operation').options as INodePropertyOptions[];
	const operation = options.find((o) => o.value === 'sendNotification');
	if (!operation) throw new Error('sendNotification operation not found');
	return operation as INodePropertyOptions & {
		routing: { request: Record<string, unknown>; output: { postReceive: unknown[] } };
	};
})();

/**
 * Derives the HTTP request purely from the node description and credential
 * definition — the same data n8n's declarative routing engine consumes. If a
 * routing property drifts away from the API contract, these tests fail
 * against the mock.
 */
function buildNotifyRequest(params: Record<string, string>, apiKey: string, baseUrl: string) {
	const body: Record<string, string> = {};
	for (const [name, value] of Object.entries(params)) {
		const property = findProperty(name);
		const send = property.routing?.send;
		if (!send || send.type !== 'body' || !send.property) {
			throw new Error(`Property ${name} does not route into the request body`);
		}
		body[send.property] = value;
	}

	const authTemplate = (
		credential.authenticate.properties.headers as Record<string, string>
	).Authorization;
	const authorization = authTemplate.replace(/^=/, '').replace('{{$credentials.apiKey}}', apiKey);

	return {
		method: sendOperation.routing.request.method as string,
		url: baseUrl + (sendOperation.routing.request.url as string),
		headers: {
			...(node.description.requestDefaults?.headers as Record<string, string>),
			Authorization: authorization,
		},
		body: JSON.stringify(body),
	};
}

async function sendNotify(params: Record<string, string>, apiKey: string, baseUrl: string) {
	const { method, url, headers, body } = buildNotifyRequest(params, apiKey, baseUrl);
	const response = await fetch(url, { method, headers, body });
	return { statusCode: response.status, body: (await response.json()) as Record<string, unknown> };
}

const testNode: INode = {
	id: '00000000-0000-0000-0000-000000000000',
	name: 'WorkflowBuddy',
	type: 'n8n-nodes-workflowbuddy.workflowBuddy',
	typeVersion: 1,
	position: [0, 0],
	parameters: {},
};

const executeContext = { getNode: () => testNode } as unknown as IExecuteSingleFunctions;
const items: INodeExecutionData[] = [{ json: { ok: true } }];

const callHandler = async (statusCode: number, body: unknown = {}) =>
	await handleNotifyResponse.call(executeContext, items, {
		statusCode,
		body,
		headers: {},
	} as IN8nHttpFullResponse);

const expectNodeApiError = async (statusCode: number, body: unknown = {}) => {
	try {
		await callHandler(statusCode, body);
	} catch (error) {
		expect(error).toBeInstanceOf(NodeApiError);
		return error as NodeApiError;
	}
	throw new Error(`Expected handler to throw for status ${statusCode}`);
};

describe('node description', () => {
	it('registers the expected node and credential', () => {
		expect(node.description.name).toBe('workflowBuddy');
		expect(node.description.displayName).toBe('WorkflowBuddy');
		expect(node.description.usableAsTool).toBe(true);
		expect(node.description.credentials).toEqual([{ name: credential.name, required: true }]);
	});

	it('targets the production API', () => {
		expect(node.description.requestDefaults?.baseURL).toBe('https://companion.amelus.de');
		expect(sendOperation.routing.request).toMatchObject({
			method: 'POST',
			url: '/api/notify',
			ignoreHttpStatusErrors: true,
		});
	});

	it('routes errors through the response handler', () => {
		expect(sendOperation.routing.output.postReceive).toContain(handleNotifyResponse);
	});

	it('maps title, message, and severity into the request body', () => {
		for (const name of ['title', 'message', 'severity']) {
			expect(findProperty(name).routing?.send).toMatchObject({ type: 'body', property: name });
		}
		expect(findProperty('title').required).toBe(true);
		expect(findProperty('message').required).toBe(true);

		const severity = findProperty('severity');
		expect(severity.default).toBe('info');
		expect((severity.options as INodePropertyOptions[]).map((o) => o.value).sort()).toEqual([
			'critical',
			'info',
			'warning',
		]);
	});

	it('matches the compiled paths declared in package.json', () => {
		const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'));
		expect(packageJson.n8n.nodes).toEqual(['dist/nodes/WorkflowBuddy/WorkflowBuddy.node.js']);
		expect(packageJson.n8n.credentials).toEqual([
			'dist/credentials/WorkflowBuddyApi.credentials.js',
		]);
	});
});

describe('request mapping against the API mock', () => {
	let mock: Awaited<ReturnType<typeof startMockServer>>;

	beforeAll(async () => {
		mock = await startMockServer();
	});

	afterAll(async () => {
		await mock.close();
	});

	const params = { title: 'Invoice sync failed', message: 'Execution 4711 failed' };

	it('delivers a valid notification', async () => {
		const response = await sendNotify({ ...params, severity: 'critical' }, VALID_KEY, mock.url);
		expect(response).toEqual({ statusCode: 200, body: { ok: true } });
	});

	it('delivers without explicit severity', async () => {
		const response = await sendNotify(params, VALID_KEY, mock.url);
		expect(response.statusCode).toBe(200);
	});

	it('is rejected with 400 for an overlong title', async () => {
		const response = await sendNotify({ ...params, title: 'x'.repeat(121) }, VALID_KEY, mock.url);
		expect(response.statusCode).toBe(400);
		expect(response.body.error).toContain('title');
	});

	it('is rejected with 400 for an overlong message', async () => {
		const response = await sendNotify(
			{ ...params, message: 'x'.repeat(1001) },
			VALID_KEY,
			mock.url,
		);
		expect(response.statusCode).toBe(400);
		expect(response.body.error).toContain('message');
	});

	it('is rejected with 401 for an unknown key', async () => {
		const response = await sendNotify(params, 'wb_' + 'f'.repeat(64), mock.url);
		expect(response.statusCode).toBe(401);
	});

	it('is rejected with 429 when rate limited', async () => {
		const response = await sendNotify(params, RATE_LIMITED_KEY, mock.url);
		expect(response.statusCode).toBe(429);
	});

	it('surfaces APNs failures as 502/503', async () => {
		expect((await sendNotify(params, APNS_ERROR_KEY, mock.url)).statusCode).toBe(502);
		expect((await sendNotify(params, APNS_UNAVAILABLE_KEY, mock.url)).statusCode).toBe(503);
	});
});

describe('handleNotifyResponse', () => {
	it('passes 2xx responses through unchanged', async () => {
		expect(await callHandler(200, { ok: true })).toBe(items);
	});

	it('explains validation failures (400)', async () => {
		const error = await expectNodeApiError(400, { ok: false, error: 'title is too long' });
		expect(error.message).toContain('rejected the notification as invalid');
		expect(error.description).toBe('title is too long');
	});

	it('falls back to limit hints when 400 has no error detail', async () => {
		const error = await expectNodeApiError(400);
		expect(error.description).toContain('120 characters');
		expect(error.description).toContain('1000 characters');
	});

	it('points to key rotation in the app settings (401)', async () => {
		const error = await expectNodeApiError(401, { ok: false, error: 'Invalid or revoked API key' });
		expect(error.message).toContain('invalid or has been revoked');
		expect(error.description).toContain('Settings → Push API');
	});

	it('explains plan limits (429)', async () => {
		const error = await expectNodeApiError(429, { ok: false, error: 'Rate limit exceeded' });
		expect(error.message).toContain('push limit');
		expect(error.description).toContain('50 pushes/day');
	});

	it('marks APNs failures as transient (502/503)', async () => {
		for (const statusCode of [502, 503]) {
			const error = await expectNodeApiError(statusCode);
			expect(error.message).toContain('could not deliver');
			expect(error.description).toContain('transient');
		}
	});

	it('reports unexpected status codes generically', async () => {
		const error = await expectNodeApiError(418);
		expect(error.message).toContain('418');
	});
});

describe('credential', () => {
	it('masks the API key input', () => {
		const apiKey = credential.properties.find((p) => p.name === 'apiKey');
		expect(apiKey?.typeOptions?.password).toBe(true);
		expect(apiKey?.required).toBe(true);
	});

	it('authenticates via Bearer header', () => {
		expect((credential.authenticate.properties.headers as Record<string, string>).Authorization)
			.toBe('=Bearer {{$credentials.apiKey}}');
	});

	it('tests the key without sending a push: 400 passes, 401/429 fail with guidance', () => {
		expect(credential.test.request).toMatchObject({
			baseURL: node.description.requestDefaults?.baseURL,
			url: '/api/notify',
			method: 'POST',
			ignoreHttpStatusErrors: { ignore: true, except: [401, 429] },
		});
		const ruleCodes = credential.test.rules?.map((rule) =>
			rule.type === 'responseCode' ? rule.properties.value : undefined,
		);
		expect(ruleCodes).toEqual([401, 429]);
	});

	it('relies on auth being checked before validation — verified against the mock', async () => {
		const mock = await startMockServer();
		try {
			// Empty body + valid key => 400 (which the credential test ignores => key accepted)
			const validKey = await fetch(`${mock.url}/api/notify`, {
				method: 'POST',
				headers: { Authorization: `Bearer ${VALID_KEY}` },
			});
			expect(validKey.status).toBe(400);

			// Empty body + bad key => 401 (which the credential test reports as invalid key)
			const badKey = await fetch(`${mock.url}/api/notify`, {
				method: 'POST',
				headers: { Authorization: `Bearer ${'wb_' + 'f'.repeat(64)}` },
			});
			expect(badKey.status).toBe(401);
		} finally {
			await mock.close();
		}
	});
});
