import {
	NodeApiError,
	NodeConnectionTypes,
	type IDataObject,
	type IExecuteSingleFunctions,
	type IN8nHttpFullResponse,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
	type JsonObject,
} from 'n8n-workflow';

/**
 * Maps WorkflowBuddy API error responses to actionable error messages.
 *
 * The request is sent with `ignoreHttpStatusErrors` so that non-2xx responses
 * reach this handler instead of n8n's generic HTTP error.
 */
export async function handleNotifyResponse(
	this: IExecuteSingleFunctions,
	items: INodeExecutionData[],
	response: IN8nHttpFullResponse,
): Promise<INodeExecutionData[]> {
	const { statusCode } = response;

	if (statusCode >= 200 && statusCode < 300) {
		return items;
	}

	const body = response.body as IDataObject | undefined;
	const apiError = typeof body?.error === 'string' ? body.error : undefined;

	let message: string;
	let description: string;

	switch (statusCode) {
		case 400:
			message = 'The WorkflowBuddy API rejected the notification as invalid';
			description =
				apiError ??
				'Check that Title is at most 120 characters and Message is at most 1000 characters.';
			break;
		case 401:
			message = 'Your WorkflowBuddy API key is invalid or has been revoked';
			description =
				'Open the WorkflowBuddy app on your iPhone, go to Settings → Push API, copy a fresh API key, and update the credential used by this node.';
			break;
		case 429:
			message = 'WorkflowBuddy push limit reached';
			description =
				'You have hit the rate limit of your plan (currently Free: 50 pushes/day with a 10/min burst; Premium: 500 pushes/day with 60/min). Wait before retrying, reduce how often this node runs, or upgrade in the app.';
			break;
		case 502:
		case 503:
			message = 'WorkflowBuddy could not deliver the notification right now';
			description =
				'The Apple Push Notification service is temporarily unavailable. This is usually transient — try again in a few minutes.';
			break;
		default:
			message = `The WorkflowBuddy API returned an unexpected error (HTTP ${statusCode})`;
			description = apiError ?? 'See the error details for the full response.';
	}

	throw new NodeApiError(this.getNode(), (body ?? {}) as JsonObject, {
		message,
		description,
		httpCode: String(statusCode),
	});
}

export class WorkflowBuddy implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'WorkflowBuddy',
		name: 'workflowBuddy',
		icon: { light: 'file:workflowbuddy.svg', dark: 'file:workflowbuddy.dark.svg' },
		group: ['output'],
		version: 1,
		subtitle: 'Send Notification',
		description: 'Send push notifications to your iPhone via WorkflowBuddy',
		defaults: {
			name: 'WorkflowBuddy',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'workflowBuddyApi', required: true }],
		requestDefaults: {
			baseURL: 'https://companion.amelus.de',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Send Notification',
						value: 'sendNotification',
						action: 'Send a push notification',
						description: 'Send a push notification to your iPhone via the WorkflowBuddy app',
						routing: {
							request: {
								method: 'POST',
								url: '/api/notify',
								ignoreHttpStatusErrors: true,
							},
							output: {
								postReceive: [handleNotifyResponse],
							},
						},
					},
				],
				default: 'sendNotification',
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'e.g. Invoice sync failed',
				description: 'Title of the push notification (max 120 characters)',
				displayOptions: {
					show: {
						operation: ['sendNotification'],
					},
				},
				routing: {
					send: {
						type: 'body',
						property: 'title',
					},
				},
			},
			{
				displayName: 'Message',
				name: 'message',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				required: true,
				default: '',
				placeholder: 'e.g. Execution 4711 failed at the HTTP Request node',
				description: 'Body text of the push notification (max 1000 characters)',
				displayOptions: {
					show: {
						operation: ['sendNotification'],
					},
				},
				routing: {
					send: {
						type: 'body',
						property: 'message',
					},
				},
			},
			{
				displayName: 'Severity',
				name: 'severity',
				type: 'options',
				options: [
					{
						name: 'Critical',
						value: 'critical',
					},
					{
						name: 'Info',
						value: 'info',
					},
					{
						name: 'Warning',
						value: 'warning',
					},
				],
				default: 'info',
				description:
					'Severity of the notification. Currently stored as metadata only — it does not change how the notification is displayed.',
				displayOptions: {
					show: {
						operation: ['sendNotification'],
					},
				},
				routing: {
					send: {
						type: 'body',
						property: 'severity',
					},
				},
			},
		],
	};
}
