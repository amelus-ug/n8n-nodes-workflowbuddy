# n8n-nodes-workflowbuddy

This is an [n8n](https://n8n.io/) community node that sends **push notifications to your iPhone** via the [WorkflowBuddy](https://apps.apple.com/app/id6760253861) app — straight from your workflows, with no Slack, Telegram, or e-mail detour.

[WorkflowBuddy](https://www.amelus.de) is an iOS companion app for n8n that monitors your workflows and notifies you on your phone when something needs your attention.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

<!-- TODO before submission: add screenshot of the node inside the n8n editor (docs/images/node-editor.png) -->

[Installation](#installation) ·
[Operations](#operations) ·
[Credentials](#credentials) ·
[Usage](#usage) ·
[Limits](#limits) ·
[Compatibility](#compatibility) ·
[Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation:

1. In n8n, go to **Settings → Community Nodes**.
2. Select **Install** and enter `n8n-nodes-workflowbuddy`.
3. Agree to the risks of community nodes and select **Install**.

After installation, the **WorkflowBuddy** node appears in the node search panel.

## Operations

### Send Notification

Sends a push notification to your iPhone.

| Field    | Required | Description                                                                                                      |
| -------- | -------- | ---------------------------------------------------------------------------------------------------------------- |
| Title    | yes      | Notification title, max 120 characters                                                                            |
| Message  | yes      | Notification body, max 1000 characters                                                                            |
| Severity | no       | `info` (default), `warning`, or `critical`. Currently stored as metadata only — it does not change how the notification is displayed. |

Good to know:

- Tapping the notification opens the WorkflowBuddy app.
- Notifications sent through this node are delivered even during the quiet hours configured in the app.
- The node can be used as a **tool by AI agents** (e.g. "notify me on my phone when you are done").

## Credentials

You need the WorkflowBuddy iOS app and an API key:

1. Install [WorkflowBuddy from the App Store](https://apps.apple.com/app/id6760253861) (a free tier is available).
2. In the app, open **Settings → Push API** and copy your API key (it starts with `wb_`).
3. In n8n, create a **WorkflowBuddy API** credential and paste the key.

Use the **Test** button on the credential to verify the key — this checks your key against the API **without** sending a notification to your phone.

If a key is ever compromised, revoke and regenerate it in the app under **Settings → Push API**.

## Usage

A typical setup is an error workflow that pings your phone whenever any workflow fails:

1. Create a new workflow with an **Error Trigger** node.
2. Add the **WorkflowBuddy** node (see [examples/error-alert-workflow.json](examples/error-alert-workflow.json) for an importable example).
3. In your other workflows, set this workflow as the error workflow (**Workflow Settings → Error Workflow**).

Example field values in the WorkflowBuddy node:

- **Title:** `Workflow failed: {{ $json.workflow.name }}`
- **Message:** `{{ $json.execution.error.message }} — {{ $json.execution.url }}`
- **Severity:** `critical`

<!-- TODO before submission: add screenshot of the example error workflow (docs/images/error-workflow.png) -->

## Limits

Push delivery is subject to the limits of your WorkflowBuddy plan (these may change over time):

- **Free:** currently 50 pushes/day, 10/min burst
- **Premium:** currently 500 pushes/day, 60/min

When a limit is reached, the API responds with `429` and the node fails with a clear error message. Validation errors (`400`), invalid keys (`401`), and temporary delivery problems (`502`/`503`) are also reported with actionable messages.

## Compatibility

Requires n8n version 1.x or newer. Developed and tested against n8n 2.25.

## Resources

- [WorkflowBuddy on the App Store](https://apps.apple.com/app/id6760253861)
- [Amelus UG — the company behind WorkflowBuddy](https://www.amelus.de)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)

## License

[MIT](LICENSE.md)
