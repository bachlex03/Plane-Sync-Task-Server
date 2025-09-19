import path from "path";
import chalk from "chalk";
import fs from "fs";
import "dotenv/config";

import { markdownParser } from "../src/utils/markdown-parser.js";
import { extractIssues, validateIssue } from "../src/utils/issue-extractor.js";
import { createIssue, getIssues, renameIssue } from "../src/apis/issue.api.js";
import { getLabels } from "../src/apis/label.api.js";

const docsPath = path.resolve(process.cwd(), "docs");
const backendPath = path.resolve(docsPath, "backend");
const backendImplementationPhasesPath = path.resolve(
  backendPath,
  "backend-implementation-phases.md"
);

const outputFolder = path.resolve(process.cwd(), "output");
const exportIssuePhase1Path = path.resolve(
  outputFolder,
  "backend-issues-phase2_1.json"
);

const PHASE_NAME =
  "Phase 2.1: [BE-OPS] Quản trị vận hành & kỹ thuật (Operation & Technical Management)";

/**
 * Extract label from module name
 * @param {string} moduleName - Module name containing label
 * @returns {string} Extracted label or empty string
 */
function extractLabelFromModuleName(moduleName) {
  if (!moduleName) return "";

  // Look for pattern [LABEL] in the module name
  const labelMatch = moduleName.match(/\[([A-Z0-9-_]+)\]/);
  return labelMatch ? `[${labelMatch[1]}]` : "";
}

/**
 * Find label ID by label name
 * @param {Array} labels - Array of labels from API
 * @param {string} labelName - Label name to find (e.g., "BE-CORE")
 * @returns {string|null} Label ID or null if not found
 */
function findLabelIdByName(labels, labelName) {
  if (!labels || !Array.isArray(labels)) {
    return null;
  }

  // Remove brackets from label name for comparison
  const cleanLabelName = labelName.replace(/[\[\]]/g, "");

  const label = labels.find(
    (l) => l.name.toLowerCase() === cleanLabelName.toLowerCase()
  );

  return label ? label.id : null;
}

/**
 * Extract issues from a specific phase section
 * @param {Object} ast - The parsed markdown AST
 * @param {string} phaseName - The phase name to extract issues from
 * @param {Array} labels - Array of labels from API (optional)
 * @returns {Array} Array of issues from the specified phase
 */
function extractIssuesFromPhase(ast, phaseName, labels = []) {
  const issues = [];
  let inTargetPhase = false;
  let currentModuleName = "";
  let currentModuleLabel = "";

  // Walk through the AST to find the target phase and its issues
  walkAST(ast, (node) => {
    // Check for phase headers (##)
    if (node.type === "heading" && (node.depth === 2 || node.depth === 3)) {
      const headingText = extractTextFromHeading(node);
      if (headingText.includes(phaseName)) {
        inTargetPhase = true;
        currentModuleName = headingText;
        currentModuleLabel = extractLabelFromModuleName(headingText);
        console.log(chalk.cyan(`Found target phase: "${headingText}"`));
        console.log(chalk.gray(`  Module label: "${currentModuleLabel}"`));
      } else {
        // If we encounter another phase header, stop processing
        inTargetPhase = false;
        currentModuleName = "";
        currentModuleLabel = "";
      }
    }
    // Check for sub-phase headers (###) - these should stop processing for the main phase
    else if (node.type === "heading" && node.depth === 3) {
      if (inTargetPhase) {
        // Stop processing when we encounter sub-phases
        inTargetPhase = false;
        currentModuleName = "";
        currentModuleLabel = "";
        console.log(
          chalk.gray(`Stopping at sub-phase: "${extractTextFromHeading(node)}"`)
        );
      }
    }
    // Extract issues from list items (only when in target phase)
    else if (node.type === "listItem" && hasCheckbox(node) && inTargetPhase) {
      const issue = extractIssueFromListItem(node);
      if (issue) {
        // Add module information to the issue
        issue.module_name = currentModuleName;
        issue.type = "main_issue";
        issue.is_completed = issue.markdown.isCompleted;

        // Add label prefix to issue name if module has a label
        if (currentModuleLabel) {
          issue.name = `${currentModuleLabel}: ${issue.name}`;
          console.log(chalk.gray(`  Added label prefix: "${issue.name}"`));
        }

        // Add label ID to issue labels array if labels are provided
        if (labels.length > 0 && currentModuleLabel) {
          const labelId = findLabelIdByName(labels, currentModuleLabel);
          if (labelId) {
            issue.labels = [labelId];
            console.log(chalk.gray(`  Added label ID: ${labelId}`));
          } else {
            console.log(
              chalk.yellow(
                `  ⚠️  Label ID not found for: ${currentModuleLabel}`
              )
            );
            issue.labels = [];
          }
        } else {
          issue.labels = [];
        }

        issues.push(issue);
      }
    }
  });

  return issues;
}

/**
 * Walk through AST nodes recursively
 * @param {Object} node - AST node
 * @param {Function} callback - Callback function for each node
 */
function walkAST(node, callback) {
  callback(node);
  if (node.children) {
    node.children.forEach((child) => walkAST(child, callback));
  }
}

/**
 * Extract text content from heading node
 * @param {Object} heading - Heading AST node
 * @returns {string} Heading text content
 */
function extractTextFromHeading(heading) {
  if (!heading.children) {
    return "";
  }

  let text = "";
  heading.children.forEach((child) => {
    if (child.type === "text") {
      text += child.value;
    }
  });

  return text.trim();
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

  // Extract issue name (everything before any links)
  // Remove link patterns like [text](url) at the end
  let name = textWithoutPriority.trim();

  // Extract link from markdown pattern [text](url) at the end
  const linkPattern = /\s*\[([^\]]+)\]\(([^)]+)\)\s*$/;
  const linkMatch = name.match(linkPattern);
  let linkSubIssue = "";

  if (linkMatch) {
    linkSubIssue = linkMatch[2]; // Extract the URL part
    name = name.replace(linkPattern, "").trim(); // Remove the link from name
  }

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
    link_sub_issue: linkSubIssue,
    markdown: {
      isCompleted: isCompleted,
      raw_text: `- ${text}`,
    },
  };
}

/**
 * Export issues to JSON file in the defined format
 * @param {Array} issues - Array of issues to export
 * @param {string} outputPath - Path to save the JSON file
 * @returns {Promise<void>}
 */
async function exportIssuesToJSON(issues, outputPath) {
  try {
    // Ensure the directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Create the JSON structure as defined in the rules
    const issuesData = {
      issues: issues.map((issue) => ({
        type: issue.type || "main_issue",
        module_name: issue.module_name || "",
        name: issue.name,
        raw_text: issue.markdown.raw_text,
        link_sub_issue: issue.link_sub_issue || "",
        is_completed: issue.is_completed || false,
        payload: {
          id: issue.id,
          created_at: issue.created_at,
          updated_at: issue.updated_at,
          estimate_point: issue.estimate_point,
          name: issue.name,
          description_html: issue.description_html,
          description_stripped: issue.description_stripped,
          priority: issue.priority,
          start_date: issue.start_date,
          target_date: issue.target_date,
          sequence_id: issue.sequence_id,
          sort_order: issue.sort_order,
          completed_at: issue.completed_at,
          archived_at: issue.archived_at,
          is_draft: issue.is_draft,
          created_by: issue.created_by,
          updated_by: issue.updated_by,
          project: issue.project,
          workspace: issue.workspace,
          parent: issue.parent,
          state: issue.state,
          assignees: issue.assignees,
          labels: issue.labels,
        },
      })),
    };

    // Write the JSON file with proper formatting
    const jsonString = JSON.stringify(issuesData, null, 2);
    fs.writeFileSync(outputPath, jsonString, "utf8");

    console.log(`✅ Issues exported to: ${outputPath}`);
    console.log(`📋 Total issues: ${issues.length}`);
  } catch (error) {
    throw new Error(`Failed to export issues to JSON: ${error.message}`);
  }
}

async function issueParsingTest() {
  console.log(
    chalk.blue.bold(`🧪 Testing Issue Extraction from ${PHASE_NAME}`)
  );
  console.log(chalk.gray("=============================================\n"));

  // Test 1: Basic AST parsing
  let ast = null;

  console.log(chalk.blue("\n📄 Test 1: Basic AST parsing..."));
  try {
    ast = await markdownParser(backendImplementationPhasesPath);
    console.log(chalk.green("✅ AST parsing successful"));
    console.log(chalk.gray("AST type:", ast.type));
    console.log(chalk.gray("Children count:", ast.children?.length || 0));
  } catch (error) {
    console.log(chalk.red("❌ AST parsing failed:"), error.message);
    return;
  }

  // Test 1.5: Fetch labels from API
  console.log(chalk.blue("\n🏷️  Test 1.5: Fetching labels from API..."));
  let labels = [];
  try {
    labels = await getLabels();
    if (labels && labels.length > 0) {
      console.log(
        chalk.green(`✅ Labels fetched successfully: ${labels.length} labels`)
      );
      console.log(chalk.gray("Available labels:"));
      labels.forEach((label) => {
        console.log(chalk.gray(`  - "${label.name}" (ID: ${label.id})`));
      });
    } else {
      console.log(chalk.yellow("⚠️  No labels found or API error"));
    }
  } catch (error) {
    console.log(chalk.yellow(`⚠️  Error fetching labels: ${error.message}`));
    console.log(chalk.gray("Continuing without label IDs..."));
  }

  // Test 2: Extract issues from Phase name only
  console.log(chalk.blue(`\n📋 Test 2: Extract issues from ${PHASE_NAME}...`));
  try {
    const phase1Issues = extractIssuesFromPhase(ast, PHASE_NAME, labels);
    console.log(chalk.green(`✅ ${PHASE_NAME} issue extraction successful`));
    console.log(chalk.gray("Extracted issues count:", phase1Issues.length));

    if (phase1Issues.length > 0) {
      console.log(chalk.yellow(`\n📝 ${PHASE_NAME} Issues:`));
      phase1Issues.forEach((issue, index) => {
        console.log(chalk.cyan(`  Issue ${index + 1}:`));
        console.log(chalk.white(`    Name: "${issue.name}"`));
        console.log(chalk.white(`    Priority: ${issue.priority}`));
        console.log(chalk.white(`    Completed: ${issue.is_completed}`));
        console.log(chalk.white(`    Module: "${issue.module_name}"`));
        console.log(chalk.gray(`    Raw text: "${issue.markdown.raw_text}"`));
        console.log();
      });
    }
  } catch (error) {
    console.log(
      chalk.red(`❌ ${PHASE_NAME} issue extraction failed:`),
      error.message
    );
    return;
  }

  // Test 3: Issue validation
  console.log(chalk.blue(`\n✅ Test 3: Issue validation...`));
  try {
    const phase1Issues = extractIssuesFromPhase(ast, PHASE_NAME, labels);
    console.log(chalk.green(`✅ ${PHASE_NAME} Issue validation test`));

    phase1Issues.forEach((issue, index) => {
      const isValid = validateIssue(issue);
      const status = isValid
        ? chalk.green("✅ Valid")
        : chalk.red("❌ Invalid");
      console.log(chalk.gray(`  Issue ${index + 1}: ${status}`));

      if (!isValid) {
        console.log(chalk.red("    Validation failed for issue:"), issue);
        throw new Error("Validation failed for issue");
      }
    });
  } catch (error) {
    console.log(chalk.red("❌ Issue validation failed:"), error.message);
    return;
  }

  // Test 4: Export Phase name issues to JSON
  console.log(
    chalk.blue(`\n💾 Test 4: Export ${PHASE_NAME} issues to JSON...`)
  );
  try {
    const phase1Issues = extractIssuesFromPhase(ast, PHASE_NAME, labels);
    await exportIssuesToJSON(phase1Issues, exportIssuePhase1Path);
    console.log(chalk.green("✅ JSON export successful"));
  } catch (error) {
    console.log(chalk.red("❌ JSON export failed:"), error.message);
    return;
  }

  // Test 5: Summary
  console.log(chalk.green.bold("\n📊 Summary:"));
  try {
    const phase1Issues = extractIssuesFromPhase(ast, PHASE_NAME, labels);
    console.log(
      chalk.white(
        `  Total ${PHASE_NAME} issues extracted: ${phase1Issues.length}`
      )
    );

    const completedIssues = phase1Issues.filter(
      (issue) => issue.is_completed
    ).length;
    const pendingIssues = phase1Issues.length - completedIssues;

    console.log(chalk.white(`  Completed issues: ${completedIssues}`));
    console.log(chalk.white(`  Pending issues: ${pendingIssues}`));

    const highPriorityIssues = phase1Issues.filter(
      (issue) => issue.priority === "high"
    ).length;
    const mediumPriorityIssues = phase1Issues.filter(
      (issue) => issue.priority === "medium"
    ).length;
    const lowPriorityIssues = phase1Issues.filter(
      (issue) => issue.priority === "low"
    ).length;

    console.log(chalk.white(`  High priority: ${highPriorityIssues}`));
    console.log(chalk.white(`  Medium priority: ${mediumPriorityIssues}`));
    console.log(chalk.white(`  Low priority: ${lowPriorityIssues}`));

    console.log(
      chalk.white(`  JSON file exported to: ${exportIssuePhase1Path}`)
    );
  } catch (error) {
    console.log(chalk.red("❌ Summary failed:"), error.message);
  }

  console.log(
    chalk.green.bold(
      `\n🎉 ${PHASE_NAME} issue extraction and export completed!`
    )
  );
}

issueParsingTest();
