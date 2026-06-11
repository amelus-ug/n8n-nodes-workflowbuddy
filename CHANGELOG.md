# Changelog

## Unreleased

- Initial version: **WorkflowBuddy** node with a **Send Notification** operation (title, message, severity) targeting `POST https://companion.amelus.de/api/notify`.
- **WorkflowBuddy API** credential (Bearer key from the app's Settings → Push API) including a credential test that verifies the key without sending a push.
- Actionable error messages for validation errors (400), invalid keys (401), rate limits (429), and APNs outages (502/503).
- Usable as a tool by AI agents (`usableAsTool`).
