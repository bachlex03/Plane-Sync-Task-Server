/**
 * Sub Issue Extractor - Extracts sub issues from markdown files
 * Handles sub issues that are linked to parent issues via markdown files
 */

import fs from "fs";
import path from "path";
import { markdownParser } from "./markdown-parser.js";

/**
 * Extract sub issues from a markdown file
 * @param {string} filePath - Path to the markdown file
 * @param {string} parentIssueName - Name of the parent issue
 * @param {string} moduleName - Name of the module
 * @returns {Array} Array of extracted sub issue objects
 */
export async function extractSubIssuesFromFile(
  filePath,
  parentIssueName,
  moduleName
) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return [];
    }

    const ast = await markdownParser(filePath);
    const subIssues = extractSubIssuesFromAST(ast, parentIssueName, moduleName);

    console.log(
      `📄 Extracted ${subIssues.length} sub-issues from: ${path.basename(
        filePath
      )}`
    );
    return subIssues;
  } catch (error) {
    console.log(
      `❌ Error extracting sub-issues from ${filePath}: ${error.message}`
    );
    return [];
  }
}

/**
 * Extract sub issues from markdown AST
 * @param {Object} ast - The parsed markdown AST
 * @param {string} parentIssueName - Name of the parent issue
 * @param {string} moduleName - Name of the module
 * @returns {Array} Array of extracted sub issue objects
 */
export function extractSubIssuesFromAST(ast, parentIssueName, moduleName) {
  const subIssues = [];
  let currentModuleLabel = "";

  // Extract label from module name
  if (moduleName) {
    const labelMatch = moduleName.match(/\[([A-Z0-9-_]+)\]/);
    currentModuleLabel = labelMatch ? `[${labelMatch[1]}]` : "";
  }

  // Walk through the AST to find list items with checkboxes
  walkAST(ast, (node) => {
    if (node.type === "listItem" && hasCheckbox(node)) {
      const subIssue = extractSubIssueFromListItem(
        node,
        parentIssueName,
        moduleName,
        currentModuleLabel
      );
      if (subIssue) {
        subIssues.push(subIssue);
      }
    }
  });

  return subIssues;
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
 * Extract sub issue information from a list item
 * @param {Object} listItem - List item AST node
 * @param {string} parentIssueName - Name of the parent issue
 * @param {string} moduleName - Name of the module
 * @param {string} moduleLabel - Label of the module
 * @returns {Object|null} Sub issue object or null if not a valid sub issue
 */
function extractSubIssueFromListItem(
  listItem,
  parentIssueName,
  moduleName,
  moduleLabel
) {
  if (!listItem.children || listItem.children.length === 0) {
    return null;
  }

  const paragraph = listItem.children[0];
  if (paragraph.type !== "paragraph" || !paragraph.children) {
    return null;
  }

  // Get the text content
  const textContent = extractTextContent(paragraph);

  // Parse the sub issue components
  const subIssue = parseSubIssueText(
    textContent,
    parentIssueName,
    moduleName,
    moduleLabel
  );

  return subIssue;
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
 * Parse sub issue text to extract components
 * @param {string} text - Raw sub issue text
 * @param {string} parentIssueName - Name of the parent issue
 * @param {string} moduleName - Name of the module
 * @param {string} moduleLabel - Label of the module
 * @returns {Object} Parsed sub issue object
 */
function parseSubIssueText(text, parentIssueName, moduleName, moduleLabel) {
  // Remove leading checkbox
  const clean_text = text.replace(/^\[[ x]\]\s*/, "");

  // Extract priority indicator
  const priorityMatch = clean_text.match(/^\[(High|Medium|Low|Urgent)\]\s*/i);
  const priority = priorityMatch ? priorityMatch[1].toLowerCase() : "none";

  // Remove priority indicator from text
  const textWithoutPriority = clean_text.replace(
    /^\[(High|Medium|Low|Urgent)\]\s*/i,
    ""
  );

  // Extract checkbox state
  const checkboxState = text.match(/^\[([ x])\]/);
  const isCompleted = checkboxState && checkboxState[1] === "x";

  // Extract sub issue name (everything before any links)
  let name = textWithoutPriority.trim();

  // Remove markdown links at the end using regex
  const linkPattern = /\s*\[([^\]]+)\]\([^)]+\)\s*$/;
  name = name.replace(linkPattern, "").trim();

  // Skip items that are section headers (format: "[High] **Text:**" with priority and bold text ending in colon)
  // Examples: "[High] **Kiểm thử tự động:**", "[Medium] **Kiểm thử bảo mật:**", etc.
  if (
    name.match(/^\[(High|Medium|Low|Urgent)\]\s*\*\*.*:$/) ||
    name.endsWith(":")
  ) {
    return null;
  }

  // Sub-issues don't include labels
  let labelIds = [];

  return {
    type: "sub_issue",
    module_name: moduleName,
    parent_issue_name: parentIssueName,
    name: name,
    raw_text: `- ${text}`,
    is_completed: isCompleted,
    payload: {
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
      labels: labelIds,
    },
  };
}

/**
 * Validate extracted sub issue
 * @param {Object} subIssue - Sub issue object to validate
 * @returns {boolean} True if sub issue is valid
 */
export function validateSubIssue(subIssue) {
  return (
    subIssue &&
    subIssue.type === "sub_issue" &&
    typeof subIssue.name === "string" &&
    subIssue.name.trim().length > 0 &&
    typeof subIssue.parent_issue_name === "string" &&
    subIssue.parent_issue_name.trim().length > 0 &&
    typeof subIssue.module_name === "string" &&
    subIssue.module_name.trim().length > 0 &&
    typeof subIssue.payload.priority === "string" &&
    ["none", "low", "medium", "high", "urgent"].includes(
      subIssue.payload.priority
    ) &&
    typeof subIssue.is_completed === "boolean"
  );
}

/**
 * Export sub issues to JSON file
 * @param {Array} subIssues - Array of sub issues to export
 * @param {string} outputPath - Path to save the JSON file
 * @returns {Promise<void>}
 */
export async function exportSubIssuesToJSON(subIssues, outputPath) {
  try {
    // Ensure the directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Create the JSON structure as defined in the rules
    const subIssuesData = {
      issues: subIssues,
    };

    // Write the JSON file with proper formatting
    const jsonString = JSON.stringify(subIssuesData, null, 2);
    fs.writeFileSync(outputPath, jsonString, "utf8");

    console.log(`✅ Sub-issues exported to: ${outputPath}`);
    console.log(`📋 Total sub-issues: ${subIssues.length}`);
  } catch (error) {
    throw new Error(`Failed to export sub-issues to JSON: ${error.message}`);
  }
}
