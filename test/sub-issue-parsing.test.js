import path from "path";
import chalk from "chalk";
import fs from "fs";
import "dotenv/config";

import { markdownParser } from "../src/utils/markdown-parser.js";
import {
  extractSubIssuesFromFile,
  extractSubIssuesFromAST,
  validateSubIssue,
  exportSubIssuesToJSON,
} from "../src/utils/sub-issue-extractor.js";

const docsPath = path.resolve(process.cwd(), "docs");
const backendPath = path.resolve(docsPath, "backend");
const phasePath = path.resolve(backendPath, "Phase1");

const parentIssuesJSONPath = path.resolve(
  process.cwd(),
  "output",
  "backend-issues-phase1.json"
);

const subIssuesJSONPath = path.resolve(
  process.cwd(),
  "output",
  "backend-sub-issues-phase1.json"
);

/**
 * Load parent issues from JSON file
 * @returns {Object} Parent issues data from JSON file
 */
function loadParentIssuesFromJSON() {
  try {
    if (!fs.existsSync(parentIssuesJSONPath)) {
      throw new Error(
        `Parent issues JSON file not found: ${parentIssuesJSONPath}`
      );
    }

    const jsonContent = fs.readFileSync(parentIssuesJSONPath, "utf8");
    const parentIssuesData = JSON.parse(jsonContent);

    console.log(
      chalk.green(
        `✅ Loaded ${parentIssuesData.issues.length} parent issues from JSON`
      )
    );
    return parentIssuesData;
  } catch (error) {
    console.log(
      chalk.red(`❌ Error loading parent issues JSON file: ${error.message}`)
    );
    throw error;
  }
}

/**
 * Get all markdown files in Phase1 directory
 * @returns {Array} Array of markdown file paths
 */
function getPhase1MarkdownFiles() {
  try {
    if (!fs.existsSync(phasePath)) {
      console.log(chalk.yellow(`⚠️  Phase1 directory not found: ${phasePath}`));
      return [];
    }

    const files = fs.readdirSync(phasePath);
    const markdownFiles = files
      .filter((file) => file.endsWith(".md"))
      .map((file) => path.resolve(phasePath, file));

    console.log(
      chalk.blue(`📁 Found ${markdownFiles.length} markdown files in Phase1:`)
    );
    markdownFiles.forEach((file) => {
      console.log(chalk.gray(`  - ${path.basename(file)}`));
    });

    return markdownFiles;
  } catch (error) {
    console.log(
      chalk.red(`❌ Error reading Phase1 directory: ${error.message}`)
    );
    return [];
  }
}

/**
 * Find parent issue by link sub issue path
 * @param {Array} parentIssues - Array of parent issues
 * @param {string} linkPath - Link path from sub issue (e.g., "./Phase1/api-gateway.md")
 * @returns {Object|null} Parent issue or null if not found
 */
function findParentIssueByLink(parentIssues, linkPath) {
  if (!linkPath) return null;

  // Extract filename from path (e.g., "./Phase1/api-gateway.md" -> "api-gateway.md")
  const filename = path.basename(linkPath);

  // Find parent issue that has this link in its link_sub_issue field
  const parentIssue = parentIssues.find((issue) => {
    if (issue.link_sub_issue) {
      const parentLinkFilename = path.basename(issue.link_sub_issue);
      return parentLinkFilename === filename;
    }
    return false;
  });

  return parentIssue || null;
}

async function subIssueParsingTest() {
  console.log(chalk.blue.bold("🧪 Testing Sub Issue Extraction from Phase 1"));
  console.log(chalk.gray("================================================\n"));

  try {
    // Step 1: Load parent issues from JSON
    console.log(chalk.blue("📄 Step 1: Loading parent issues from JSON..."));
    const parentIssuesData = loadParentIssuesFromJSON();
    const parentIssues = parentIssuesData.issues;

    // Step 2: Get all markdown files in Phase1 directory
    console.log(chalk.blue("\n📁 Step 2: Getting Phase1 markdown files..."));
    const markdownFiles = getPhase1MarkdownFiles();

    if (markdownFiles.length === 0) {
      console.log(
        chalk.yellow("⚠️  No markdown files found in Phase1 directory")
      );
      return;
    }

    // Step 3: Extract sub issues from each markdown file
    console.log(
      chalk.blue("\n📋 Step 3: Extracting sub issues from markdown files...")
    );
    const allSubIssues = [];

    for (const filePath of markdownFiles) {
      const filename = path.basename(filePath);
      console.log(chalk.cyan(`\n📄 Processing: ${filename}`));

      // Find the parent issue for this file
      const parentIssue = findParentIssueByLink(
        parentIssues,
        `./Phase1/${filename}`
      );

      if (!parentIssue) {
        console.log(
          chalk.yellow(`  ⚠️  No parent issue found for: ${filename}`)
        );
        continue;
      }

      console.log(chalk.gray(`  Parent issue: "${parentIssue.name}"`));
      console.log(chalk.gray(`  Module: "${parentIssue.module_name}"`));

      // Extract sub issues from the file
      const subIssues = await extractSubIssuesFromFile(
        filePath,
        parentIssue.name,
        parentIssue.module_name
      );

      if (subIssues.length > 0) {
        console.log(
          chalk.green(`  ✅ Extracted ${subIssues.length} sub-issues`)
        );
        allSubIssues.push(...subIssues);
      } else {
        console.log(chalk.gray(`  📝 No sub-issues found`));
      }
    }

    // Step 4: Validate sub issues and filter valid ones
    console.log(chalk.blue("\n✅ Step 4: Validating sub issues..."));
    let validCount = 0;
    let invalidCount = 0;
    const validSubIssues = [];

    allSubIssues.forEach((subIssue, index) => {
      const isValid = validateSubIssue(subIssue);
      if (isValid) {
        validCount++;
        validSubIssues.push(subIssue);
        console.log(chalk.green(`  ✅ Sub-issue ${index + 1}: Valid`));
      } else {
        invalidCount++;
        console.log(chalk.red(`  ❌ Sub-issue ${index + 1}: Invalid`));
        console.log(
          chalk.red(`    Validation failed for sub-issue:`),
          subIssue
        );
      }
    });

    console.log(chalk.blue(`\n📊 Validation Summary:`));
    console.log(chalk.white(`  Valid sub-issues: ${validCount}`));
    console.log(chalk.white(`  Invalid sub-issues: ${invalidCount}`));

    // Step 5: Export only valid sub issues to JSON
    console.log(
      chalk.blue("\n💾 Step 5: Exporting valid sub issues to JSON...")
    );
    if (validSubIssues.length > 0) {
      await exportSubIssuesToJSON(validSubIssues, subIssuesJSONPath);
      console.log(
        chalk.green(
          `✅ JSON export successful - ${validSubIssues.length} valid sub-issues exported`
        )
      );
    } else {
      console.log(chalk.yellow("⚠️  No valid sub-issues to export"));
    }

    // Step 6: Summary
    console.log(chalk.green.bold("\n📊 Final Summary:"));
    console.log(chalk.white(`  Total parent issues: ${parentIssues.length}`));
    console.log(
      chalk.white(`  Markdown files processed: ${markdownFiles.length}`)
    );
    console.log(
      chalk.white(`  Total sub-issues extracted: ${allSubIssues.length}`)
    );
    console.log(chalk.white(`  Valid sub-issues: ${validCount}`));
    console.log(chalk.white(`  Invalid sub-issues: ${invalidCount}`));

    if (validSubIssues.length > 0) {
      const completedSubIssues = validSubIssues.filter(
        (subIssue) => subIssue.is_completed
      ).length;
      const pendingSubIssues = validSubIssues.length - completedSubIssues;

      console.log(chalk.white(`  Completed sub-issues: ${completedSubIssues}`));
      console.log(chalk.white(`  Pending sub-issues: ${pendingSubIssues}`));

      const highPrioritySubIssues = validSubIssues.filter(
        (subIssue) => subIssue.payload.priority === "high"
      ).length;
      const mediumPrioritySubIssues = validSubIssues.filter(
        (subIssue) => subIssue.payload.priority === "medium"
      ).length;
      const lowPrioritySubIssues = validSubIssues.filter(
        (subIssue) => subIssue.payload.priority === "low"
      ).length;

      console.log(chalk.white(`  High priority: ${highPrioritySubIssues}`));
      console.log(chalk.white(`  Medium priority: ${mediumPrioritySubIssues}`));
      console.log(chalk.white(`  Low priority: ${lowPrioritySubIssues}`));

      console.log(chalk.white(`  JSON file exported to: ${subIssuesJSONPath}`));
    }

    console.log(
      chalk.green.bold("\n🎉 Sub issue extraction and export completed!")
    );
  } catch (error) {
    console.log(chalk.red(`❌ Test failed: ${error.message}`));
  }
}

subIssueParsingTest();
