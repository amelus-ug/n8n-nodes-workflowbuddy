import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	Icon,
	INodeProperties,
} from 'n8n-workflow';

export class WorkflowBuddyApi implements ICredentialType {
	name = 'workflowBuddyApi';

	displayName = 'WorkflowBuddy API';

	icon: Icon = {
		light: 'file:../nodes/WorkflowBuddy/workflowbuddy.svg',
		dark: 'file:../nodes/WorkflowBuddy/workflowbuddy.dark.svg',
	};

	documentationUrl =
		'https://github.com/amelus-ug/n8n-nodes-workflowbuddy?tab=readme-ov-file#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			placeholder: 'wb_…',
			description:
				'Get your key in the WorkflowBuddy app on your iPhone under Settings → Push API',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	/**
	 * The API has no dedicated test endpoint, and a real request would deliver a
	 * push to the user's phone. Instead we POST an empty body: the API validates
	 * authentication before the payload, so 401 means the key is invalid while
	 * 400 (validation error) proves the key was accepted — without sending a
	 * notification. All status errors except 401/429 are therefore ignored.
	 */
	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://companion.amelus.de',
			url: '/api/notify',
			method: 'POST',
			ignoreHttpStatusErrors: { ignore: true, except: [401, 429] },
		},
		rules: [
			{
				type: 'responseCode',
				properties: {
					value: 401,
					message:
						'This API key is invalid or has been revoked. Open the WorkflowBuddy app, go to Settings → Push API, and copy a fresh key.',
				},
			},
			{
				type: 'responseCode',
				properties: {
					value: 429,
					message:
						'Your WorkflowBuddy push limit is currently exhausted, so the key could not be verified. Wait a moment and try again.',
				},
			},
		],
	};
}
