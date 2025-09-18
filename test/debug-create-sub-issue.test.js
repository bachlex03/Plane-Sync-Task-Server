import path from "path";
import chalk from "chalk";
import fs from "fs";
import "dotenv/config";

import { getIssues, createIssue } from "../src/apis/issue.api.js";

const outputFolder = path.resolve(process.cwd(), "output");
const subIssuesJSONPath = path.resolve(
  outputFolder,
  "backend-sub-issues-phase1.json"
);

const BATCH_SIZE = 20; // 20 sub-issues per batch
const SLEEP_MS = 2000; // 2 seconds sleep between batches

const addSubIssuesToParentIssueNames = [
  "[BE-CORE]: Xây dựng API Gateway / Load Balancer (Tenant routing, context injection)",
];

/**
 * Load sub issues from JSON file
 * @returns {Object} Sub issues data from JSON file
 */
function loadSubIssuesFromJSON() {
  try {
    if (!fs.existsSync(subIssuesJSONPath)) {
      throw new Error(`JSON file not found: ${subIssuesJSONPath}`);
    }

    const jsonContent = fs.readFileSync(subIssuesJSONPath, "utf8");
    const subIssuesData = JSON.parse(jsonContent);

    console.log(
      chalk.green(
        `✅ Loaded ${subIssuesData.issues.length} sub-issues from JSON`
      )
    );
    return subIssuesData;
  } catch (error) {
    console.log(chalk.red(`❌ Error loading JSON file: ${error.message}`));
    throw error;
  }
}

/**
 * Compare sub-issues from JSON with existing issues from API
 * @param {Array} jsonSubIssues - Sub-issues from JSON file
 * @param {Array} existingIssues - Issues from API
 * @returns {Array} Sub-issues that need to be created
 */
function findSubIssuesToCreate(jsonSubIssues, existingIssues) {
  const subIssuesToCreate = [];

  jsonSubIssues.forEach((jsonSubIssue) => {
    const subIssueName = jsonSubIssue.name;
    const exists = existingIssues.some(
      (existingIssue) =>
        existingIssue.name.toLowerCase() === subIssueName.toLowerCase()
    );

    if (!exists) {
      subIssuesToCreate.push(jsonSubIssue);
      console.log(chalk.yellow(`  📝 Sub-issue to create: "${subIssueName}"`));
    } else {
      console.log(
        chalk.gray(`  ✅ Sub-issue already exists: "${subIssueName}"`)
      );
    }
  });

  return subIssuesToCreate;
}

/**
 * Find parent issue by name
 * @param {Array} issues - Array of issues from API
 * @param {string} parentIssueName - Parent issue name to find
 * @returns {Object|null} Found parent issue or null
 */
function findParentIssueByName(issues, parentIssueName) {
  if (!issues || !Array.isArray(issues)) {
    return null;
  }

  const parentIssue = issues.find(
    (issue) => issue.name.toLowerCase() === parentIssueName.toLowerCase()
  );

  return parentIssue || null;
}

/**
 * Sleep utility function
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after the specified time
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function createSubIssueTest() {
  console.log(chalk.blue.bold("🧪 Testing Sub-Issue Creation Process"));
  console.log(chalk.gray("==========================================\n"));

  let processToCreate = false;

  // Step 1: Load sub-issues from JSON file
  console.log(chalk.blue("📄 Step 1: Loading sub-issues from JSON file..."));
  const jsonSubIssuesData = loadSubIssuesFromJSON();
  const allJsonSubIssues = jsonSubIssuesData.issues;

  // Filter sub-issues to only include those belonging to parent issues in our array
  const jsonSubIssues = allJsonSubIssues.filter((subIssue) =>
    addSubIssuesToParentIssueNames.includes(subIssue.parent_issue_name)
  );

  console.log(
    chalk.cyan(
      `📊 Filtered to ${jsonSubIssues.length} sub-issues for ${addSubIssuesToParentIssueNames.length} parent issue(s)`
    )
  );

  // Step 2: Get all existing issues from API
  console.log(chalk.blue("\n🌐 Step 2: Fetching existing issues from API..."));
  let cursor = "50:0:0";
  let page = 0;
  let data = await getIssues(cursor);
  let existingIssues = [...data.results];

  while (page < data.total_pages) {
    cursor = data.next_cursor;
    data = await getIssues(cursor);
    existingIssues = [...existingIssues, ...data.results];
    page++;
  }

  console.log(
    chalk.green(`✅ Found ${existingIssues.length} existing issues in Plane`)
  );

  // Step 3: Compare and find sub-issues to create
  console.log(
    chalk.blue("\n🔍 Step 3: Comparing JSON sub-issues with existing issues...")
  );
  const subIssuesToCreate = findSubIssuesToCreate(
    jsonSubIssues,
    existingIssues || []
  );

  if (subIssuesToCreate.length === 0) {
    console.log(
      chalk.green("🎉 All sub-issues from JSON already exist in Plane!")
    );
    return;
  }

  if (subIssuesToCreate.length === jsonSubIssues.length) {
    processToCreate = true;

    console.log(
      chalk.yellow(
        `\n Can create all sub-issues from JSON because some sub-issues already exist in Plane`
      )
    );
  }

  console.log(
    chalk.yellow(`\n📋 Found ${subIssuesToCreate.length} sub-issues to create:`)
  );

  // Step 4: Find parent issue IDs and prepare sub-issue creation data
  console.log(
    chalk.blue(
      "\n🔧 Step 4: Finding parent issues and preparing sub-issue creation data..."
    )
  );

  for (const parentIssueName of addSubIssuesToParentIssueNames) {
    const parentIssue = findParentIssueByName(existingIssues, parentIssueName);
    if (parentIssue) {
      console.log(
        chalk.green(
          `✅ Found parent issue: "${parentIssueName}" (ID: ${parentIssue.id})`
        )
      );

      if (processToCreate) {
        // Filter sub-issues for this parent
        const parentSubIssues = subIssuesToCreate.filter(
          (subIssue) => subIssue.parent_issue_name === parentIssue.name
        );

        console.log(
          chalk.cyan(
            `🚀 Processing ${parentSubIssues.length} sub-issues for parent: "${parentIssue.name}"`
          )
        );

        // Process in batches of BATCH_SIZE
        for (let i = 0; i < parentSubIssues.length; i += BATCH_SIZE) {
          const batch = parentSubIssues.slice(i, i + BATCH_SIZE);
          const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
          const totalBatches = Math.ceil(parentSubIssues.length / BATCH_SIZE);

          console.log(
            chalk.blue.bold(
              `\n📦 Batch ${batchNumber}/${totalBatches}: Creating ${batch.length} sub-issues concurrently...`
            )
          );

          // Prepare all sub-issues in this batch with parent ID
          const preparedSubIssues = batch.map((subIssue) => ({
            ...subIssue,
            payload: {
              ...subIssue.payload,
              parent: parentIssue.id,
            },
          }));

          // Start timing for this batch
          const batchStartTime = Date.now();

          // Create all sub-issues in this batch concurrently
          const createPromises = preparedSubIssues.map(
            async (preparedSubIssue, index) => {
              try {
                console.log(
                  chalk.blue(
                    `📤 Creating sub-issue ${i + index + 1}/${
                      parentSubIssues.length
                    }: "${preparedSubIssue.name}"`
                  )
                );
                const result = await createIssue(preparedSubIssue);
                console.log(
                  chalk.green(
                    `✅ Created sub-issue ${i + index + 1}: "${
                      preparedSubIssue.name
                    }"`
                  )
                );
                return { success: true, result, index };
              } catch (error) {
                console.log(
                  chalk.red(
                    `❌ Failed to create sub-issue ${i + index + 1}: "${
                      preparedSubIssue.name
                    }" - ${error.message}`
                  )
                );
                return { success: false, error, index };
              }
            }
          );

          // Wait for all API calls in this batch to complete
          const results = await Promise.allSettled(createPromises);

          // Calculate timing for this batch
          const batchEndTime = Date.now();
          const batchTime = batchEndTime - batchStartTime;

          // Log batch results
          const successful = results.filter(
            (r) => r.status === "fulfilled" && r.value.success
          ).length;
          const failed = results.length - successful;

          console.log(chalk.blue.bold(`\n📊 Batch ${batchNumber} Results:`));
          console.log(chalk.green(`✅ Successful: ${successful}`));
          console.log(chalk.red(`❌ Failed: ${failed}`));
          console.log(chalk.cyan(`⏱️  Batch time: ${batchTime}ms`));

          // Sleep between batches (except after the last batch)
          if (i + BATCH_SIZE < parentSubIssues.length) {
            console.log(
              chalk.yellow(`😴 Sleeping for ${SLEEP_MS}ms before next batch...`)
            );
            await sleep(SLEEP_MS);
          }
        }

        console.log(
          chalk.green.bold(
            `\n🎉 Completed all batches for parent: "${parentIssue.name}"`
          )
        );
      }
    } else {
      console.log(chalk.red(`❌ Parent issue not found: "${parentIssueName}"`));

      return;
    }
  }
}

createSubIssueTest();
