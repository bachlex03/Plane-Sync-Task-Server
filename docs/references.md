# Links to reference

- `https://developers.plane.so/`

# Solution

_Question_: I want to build a server using nodejs that sync tasks from markdown file to our Plane self hosting is it possible?

Yes, it's possible to build a Node.js server that syncs tasks from a Markdown file to a self-hosted Plane instance. Plane provides a REST API with endpoints for managing issues (which represent tasks), including creating, fetching, updating, and deleting them. This makes integration straightforward, especially since the API is available on self-hosted setups (using your custom base URL instead of the cloud one).

### High-Level Approach

To implement this, your Node.js server could:

1. **Read and Parse the Markdown File**: Use Node's `fs` module to read the file, then a library like `remark` (with plugins like `remark-parse` and `remark-task-list`) to parse the Markdown and extract task-like items (e.g., checkboxes or TODO lists).
2. **Authenticate with Plane API**: Generate an API key from your Plane instance's settings and include it in requests via the `X-API-Key` header.
3. **Sync Tasks to Plane**:
   - Fetch existing issues using `GET /api/v1/workspaces/:workspace-slug/projects/:project_id/issues/` (supports pagination for large projects).
   - For new tasks, create issues via `POST /api/v1/workspaces/:workspace-slug/projects/:project_id/issues/` with JSON payloads containing details like name, description, assignees, and state.
   - For updates, use `PATCH /api/v1/workspaces/:workspace-slug/projects/:project_id/issues/:issue_id/` to modify existing issues.
   - Handle deletions with `DELETE /api/v1/workspaces/:workspace-slug/projects/:project_id/issues/:issue_id/` if tasks are removed from the Markdown.
4. **Automation**: Run the sync periodically (e.g., via cron or file watchers) or on-demand. Use libraries like `axios` or `node-fetch` for API calls, and handle rate limits (60 requests/minute) to avoid errors.
