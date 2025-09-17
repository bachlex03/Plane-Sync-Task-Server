/**
 * Issue Extractor - Extracts issues from markdown AST
 * Handles checkbox items, priority indicators, and issue titles
 */

/**
 * Extract issues from markdown AST
 * @param {Object} ast - The parsed markdown AST
 * @returns {Array} Array of extracted issue objects
 */
export function extractIssues(ast) {
  const issues = [];

  // Walk through the AST to find list items with checkboxes
  walkAST(ast, (node) => {
    if (node.type === "listItem" && hasCheckbox(node)) {
      const issue = extractIssueFromListItem(node);
      if (issue) {
        issues.push(issue);
      }
    }
  });

  return issues;
}

/**
 * Walk through AST nodes recursively
 * @param {Object} node - Current AST node
 * @param {Function} callback - Function to call for each node
 */
function walkAST(node, callback) {
  callback(node);

  if (node.children) {
    node.children.forEach((child) => walkAST(child, callback));
  }
}

/**
 * Check if a list item has a checkbox
 * @param {Object} listItem - List item AST node
 * @returns {boolean} True if item has checkbox
 */
function hasCheckbox(listItem) {
  if (!listItem.children || listItem.children.length === 0) {
    return false;
  }

  const firstChild = listItem.children[0];
  return (
    firstChild.type === "paragraph" &&
    firstChild.children &&
    firstChild.children[0] &&
    firstChild.children[0].type === "text" &&
    (firstChild.children[0].value.startsWith("[ ]") ||
      firstChild.children[0].value.startsWith("[x]"))
  );
}

/**
 * Extract issue information from a list item
 * @param {Object} listItem - List item AST node
 * @returns {Object|null} Issue object or null if not a valid issue
 */
function extractIssueFromListItem(listItem) {
  if (!listItem.children || listItem.children.length === 0) {
    return null;
  }

  const paragraph = listItem.children[0];
  if (paragraph.type !== "paragraph" || !paragraph.children) {
    return null;
  }

  // Get the text content
  const textContent = extractTextContent(paragraph);

  // Parse the issue components
  const issue = parseIssueText(textContent);

  return issue;
}

/**
 * Extract text content from paragraph node
 * @param {Object} paragraph - Paragraph AST node
 * @returns {string} Combined text content
 */
function extractTextContent(paragraph) {
  let text = "";

  paragraph.children.forEach((child) => {
    if (child.type === "text") {
      text += child.value;
    } else if (child.type === "link") {
      // Handle standard markdown links [text](url)
      const linkText = child.children
        ? child.children.map((c) => c.value).join("")
        : "";
      const url = child.url || "";
      text += `[${linkText}](${url})`;
    }
  });

  return text;
}

/**
 * Parse issue text to extract components
 * @param {string} text - Raw issue text
 * @returns {Object} Parsed issue object
 */
function parseIssueText(text) {
  // Remove leading checkbox
  const cleanText = text.replace(/^\[[ x]\]\s*/, "");

  // Extract priority indicator
  const priorityMatch = cleanText.match(/^\[(high|medium|low|urgent)\]\s*/i);
  const priority = priorityMatch ? priorityMatch[1].toLowerCase() : "none";

  // Remove priority indicator from text
  const textWithoutPriority = cleanText.replace(
    /^\[(high|medium|low|urgent)\]\s*/i,
    ""
  );

  // Extract checkbox state
  const checkboxState = text.match(/^\[([ x])\]/);
  const isCompleted = checkboxState && checkboxState[1] === "x";

  // Extract issue name (everything before any links)
  // Remove link patterns like [text](url) at the end
  let name = textWithoutPriority.trim();

  // Remove markdown links at the end using regex
  // Pattern matches [text](url) at the end of the string
  const linkPattern = /\s*\[([^\]]+)\]\([^)]+\)\s*$/;
  name = name.replace(linkPattern, "").trim();

  return {
    id: null,
    created_at: null,
    updated_at: null,
    estimate_point: null,
    name: name,
    description_html: "<p></p>",
    description_stripped: "",
    priority: priority,
    start_date: null,
    target_date: null,
    sequence_id: null,
    sort_order: null,
    completed_at: null,
    archived_at: null,
    is_draft: false,
    created_by: null,
    updated_by: null,
    project: null,
    workspace: null,
    parent: null,
    state: null,
    assignees: [],
    labels: [],
    markdown: {
      isCompleted: isCompleted,
      rawText: text,
    },
  };
}

/**
 * Validate extracted issue
 * @param {Object} issue - Issue object to validate
 * @returns {boolean} True if issue is valid
 */
export function validateIssue(issue) {
  return (
    issue &&
    typeof issue.name === "string" &&
    issue.name.trim().length > 0 &&
    typeof issue.priority === "string" &&
    ["none", "low", "medium", "high", "urgent"].includes(issue.priority) &&
    issue.markdown &&
    typeof issue.markdown.isCompleted === "boolean"
  );
}
