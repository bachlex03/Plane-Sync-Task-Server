# Plane PM Sync - Development Checklist

## Phase 2: Markdown Parsing Implementation

### Core Parser Development

- [x] Implement markdown file reading functionality
- [x] Set up remark parser with GFM (GitHub Flavored Markdown) support
- [x] Parse markdown to Abstract Syntax Tree (AST)
- [ ] **Extract issue items from markdown** (NEXT PRIORITY):
  - [ ] Handle checkbox items (`- [ ]` and `- [x]`)
  - [ ] Parse issue titles/descriptions
  - [ ] Extract priority indicators (`[high]`, `[medium]`, `[low]`, `[urgent]`)
    <!-- - [ ] Handle nested issues (sub-issues)  -->
    <!-- - [ ] Parse due dates (if specified in markdown) -->
- [ ] Handle different markdown formats:
  - [x] Standard markdown checkboxes (example format defined)
  - [ ] GitHub-style issue lists
  - [ ] Custom issue formats

### Example Issue Format & Mapping

**Sample Markdown Issue:**

```markdown
- [ ] [high] Phát triển Auth Module (JWT, OTP, RBAC, login theo tenant) ([Xem chi tiết](./Phase1/authentication.md))
```

**Mapping to Plane API Fields:**

| Markdown Component | Plane API Field    | Value                                                        | Description                                      |
| ------------------ | ------------------ | ------------------------------------------------------------ | ------------------------------------------------ |
| `[ ]` or `[x]`     | `state`            | `null` (when creating) / "Backlog" / "Done" (when updating)  | Checkbox state determines issue status           |
| `[high]`           | `priority`         | "high"                                                       | Priority level (none, low, medium, high, urgent) |
| Main text          | `name`             | "Phát triển Auth Module (JWT, OTP, RBAC, login theo tenant)" | Issue title (required field)                     |
| Link text          | `description_html` | `""` (empty string)                                          | Description is empty for this issue format       |

**Parsed Issue Object Structure:**

```javascript
{
  name: "Phát triển Auth Module (JWT, OTP, RBAC, login theo tenant)",
  priority: "high",
  state: null, // null when creating, will be set by Plane system
  description_html: "", // empty string for this issue format
  description_stripped: "" // empty string for this issue format
}
```

**Reference:** See [Plane API Documentation](../docs/references.md) for complete field specifications.

### Issue Data Structure

- [x] Define issue object structure matching Plane API requirements (see example above)
- [x] Map markdown elements to Plane issue fields:
  - [x] Issue title → `name` (required)
  - [x] Issue description → `description_html` (empty string for this format)
  - [x] Checkbox state → issue state mapping (`null` when creating)
  - [x] Priority indicators → `priority` field (`[high]` → "high")
  - [ ] Due dates → `target_date` (if specified in markdown)
- [ ] Handle issue metadata extraction
- [ ] Implement issue validation

## Phase 3: Plane API Integration

### Authentication & API Client

- [ ] Create Plane API client using axios
- [ ] Implement API key authentication (`X-API-Key` header)
- [ ] Set up proper error handling for API calls
- [ ] Implement rate limiting (60 requests/minute)
- [ ] Add retry logic for failed requests
- [ ] Handle API response validation

### Core API Operations

- [ ] **Fetch existing issues**:
  - [ ] Implement `GET /api/v1/workspaces/:workspace-slug/projects/:project_id/issues/`
  - [ ] Handle pagination for large projects
  - [ ] Parse and store existing issue data
- [ ] **Create new issues**:
  - [ ] Implement `POST /api/v1/workspaces/:workspace-slug/projects/:project_id/issues/`
  - [ ] Map parsed issues to issue creation payload
  - [ ] Handle required fields (name, project, workspace)
  - [ ] Set optional fields (priority, target_date, etc.)
- [ ] **Update existing issues**:
  - [ ] Implement `PATCH /api/v1/workspaces/:workspace-slug/projects/:project_id/issues/:issue_id/`
  - [ ] Compare markdown issues with existing issues
  - [ ] Update changed fields only
- [ ] **Delete removed issues**:
  - [ ] Implement `DELETE /api/v1/workspaces/:workspace-slug/projects/:project_id/issues/:issue_id/`
  - [ ] Identify issues removed from markdown
  - [ ] Handle deletion confirmation

### Issue State Management

- [ ] Map checkbox states to Plane issue states:
  - [ ] `[ ]` (unchecked) → "Backlog" or "Todo" state
  - [ ] `[x]` (checked) → "Done" or "Completed" state
- [ ] Handle custom state mappings
- [ ] Implement state transition logic

## Phase 4: Sync Logic Implementation

### Issue Matching & Comparison

- [ ] Implement issue identification system:
  - [ ] Use issue titles for matching
  - [ ] Handle title changes/updates
  - [ ] Implement fuzzy matching for similar issues
- [ ] Compare markdown issues with existing Plane issues:
  - [ ] Detect new issues (create)
  - [ ] Detect modified issues (update)
  - [ ] Detect removed issues (delete)
  - [ ] Detect unchanged issues (skip)

### Sync Operations

- [ ] Implement full sync process:
  - [ ] Read and parse markdown file
  - [ ] Fetch existing Plane issues
  - [ ] Compare and identify changes
  - [ ] Execute create/update/delete operations
  - [ ] Generate sync report
- [ ] Handle sync conflicts and errors
- [ ] Implement dry-run mode for testing
- [ ] Add sync logging and reporting

### Data Persistence

- [ ] Store sync metadata:
  - [ ] Last sync timestamp
  - [ ] Issue-to-issue mapping
  - [ ] Sync history
- [ ] Handle sync state recovery
- [ ] Implement incremental sync optimization

## Phase 5: Automation & Monitoring

### Automation Options

- [ ] **File watching**:
  - [ ] Implement file system watcher
  - [ ] Auto-sync on markdown file changes
  - [ ] Debounce rapid file changes
- [ ] **Scheduled sync**:
  - [ ] Implement cron-like scheduling
  - [ ] Configurable sync intervals
  - [ ] Background sync processing
- [ ] **Manual sync**:
  - [ ] CLI command for on-demand sync
  - [ ] Interactive sync options
  - [ ] Force sync capabilities

### Error Handling & Recovery

- [ ] Implement comprehensive error handling:
  - [ ] Network errors
  - [ ] API rate limiting
  - [ ] Authentication failures
  - [ ] Invalid data errors
- [ ] Add retry mechanisms
- [ ] Implement graceful degradation
- [ ] Create error recovery procedures

### Logging & Monitoring

- [ ] Set up structured logging
- [ ] Log sync operations and results
- [ ] Monitor API usage and rate limits
- [ ] Track sync performance metrics
- [ ] Implement health checks

## Phase 6: Testing & Quality Assurance

### Unit Testing

- [ ] Test markdown parsing functionality
- [ ] Test issue extraction and mapping
- [ ] Test API client operations
- [ ] Test sync logic and comparison
- [ ] Test error handling scenarios

### Integration Testing

- [ ] Test with real Plane API (staging environment)
- [ ] Test full sync workflow
- [ ] Test with various markdown formats
- [ ] Test edge cases and error conditions

### End-to-End Testing

- [ ] Test complete markdown-to-Plane sync
- [ ] Test automation features
- [ ] Test with large markdown files
- [ ] Performance testing

## Phase 7: Documentation & Deployment

### Documentation

- [ ] Create user guide for markdown format
- [ ] Document configuration options
- [ ] Create API documentation
- [ ] Add troubleshooting guide
- [ ] Create examples and templates

### Deployment Preparation

- [ ] Create deployment scripts
- [ ] Set up production environment configuration
- [ ] Implement configuration validation
- [ ] Create backup and recovery procedures
- [ ] Set up monitoring and alerting

### Security & Best Practices

- [ ] Secure API key storage
- [ ] Implement input validation
- [ ] Add rate limiting protection
- [ ] Follow security best practices
- [ ] Regular dependency updates

## Phase 8: Advanced Features (Optional)

### Enhanced Markdown Support

- [ ] Support for custom issue attributes
- [ ] Markdown frontmatter parsing
- [ ] Custom priority indicators
- [ ] Issue tagging system
- [ ] Multi-file markdown support

### Advanced Plane Integration

- [ ] Support for multiple projects
- [ ] Issue linking and relationships
- [ ] Custom field mapping
- [ ] Label and assignee management
- [ ] Time tracking integration

### User Experience

- [ ] Interactive CLI interface
- [ ] Configuration wizard
- [ ] Sync preview and confirmation
- [ ] Progress indicators
- [ ] Detailed sync reports

---

## Success Criteria

- [ ] Successfully parse markdown files and extract issues
- [ ] Create, update, and delete Plane issues via API
- [ ] Maintain bidirectional sync between markdown and Plane
- [ ] Handle errors gracefully with proper logging
- [ ] Support automation (file watching and scheduling)
- [ ] Provide clear documentation and examples
- [ ] Achieve reliable and consistent sync operations
