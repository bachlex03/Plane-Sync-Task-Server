import path from "path";
import chalk from "chalk";
import fs from "fs";
import "dotenv/config";

import { getIssues, createIssue } from "../src/apis/issue.api.js";
import { getModules, addIssuesToModule } from "../src/apis/module.api.js";

const outputFolder = path.resolve(process.cwd(), "output");
const issuesJSONPath = path.resolve(
  outputFolder,
  "backend-issues-phase2_1.json"
);

const addIssuesToModuleName =
  "Phase 2.1: Quản trị vận hành & kỹ thuật (Operation & Technical Management)";

const BATCH_SIZE = 20; // 20 sub-issues per batch
const SLEEP_MS = 2000; // 2 seconds sleep between batches

/**
 * Load issues from JSON file
 * @returns {Object} Issues data from JSON file
 */
function loadIssuesFromJSON() {
  try {
    if (!fs.existsSync(issuesJSONPath)) {
      throw new Error(`JSON file not found: ${issuesJSONPath}`);
    }

    const jsonContent = fs.readFileSync(issuesJSONPath, "utf8");
    const issuesData = JSON.parse(jsonContent);

    console.log(
      chalk.green(`✅ Loaded ${issuesData.issues.length} issues from JSON`)
    );
    return issuesData;
  } catch (error) {
    console.log(chalk.red(`❌ Error loading JSON file: ${error.message}`));
    throw error;
  }
}

/**
 * Compare issues from JSON with existing issues from API
 * @param {Array} jsonIssues - Issues from JSON file
 * @param {Array} existingIssues - Issues from API
 * @returns {Array} Issues that need to be created
 */
function findIssuesToCreate(jsonIssues, existingIssues) {
  const issuesToCreate = [];

  jsonIssues.forEach((jsonIssue) => {
    const issueName = jsonIssue.name;
    const exists = existingIssues.some(
      (existingIssue) =>
        existingIssue.name.toLowerCase() === issueName.toLowerCase()
    );

    if (!exists) {
      issuesToCreate.push(jsonIssue);
      console.log(chalk.yellow(`  📝 Issue to create: "${issueName}"`));
    } else {
      console.log(chalk.gray(`  ✅ Issue already exists: "${issueName}"`));
    }
  });

  return issuesToCreate;
}

/**
 * Find module by name
 * @param {Array} modules - Array of modules from API
 * @param {string} moduleName - Module name to find
 * @returns {Object|null} Found module or null
 */
function findModuleByName(modules, moduleName) {
  if (!modules || !Array.isArray(modules)) {
    return null;
  }

  const module = modules.find(
    (mod) => mod.name.toLowerCase() === moduleName.toLowerCase()
  );

  return module || null;
}

async function createIssuesInBatches(preparedIssues, batchSize, sleepMs) {
  const createdIssues = [];
  const totalBatches = Math.ceil(preparedIssues.length / batchSize);
  let successCount = 0;
  let errorCount = 0;

  console.log(chalk.blue(`📊 Total batches to process: ${totalBatches}`));

  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const startIndex = batchIndex * batchSize;
    const endIndex = Math.min(startIndex + batchSize, preparedIssues.length);
    const currentBatch = preparedIssues.slice(startIndex, endIndex);

    console.log(
      chalk.cyan(
        `\n🔄 Processing batch ${batchIndex + 1}/${totalBatches} (issues ${
          startIndex + 1
        }-${endIndex})`
      )
    );

    // Create issues in current batch concurrently
    const batchPromises = currentBatch.map(async (issueData, index) => {
      const globalIndex = startIndex + index + 1;
      try {
        console.log(
          chalk.gray(
            `  📝 Creating issue ${globalIndex}/${preparedIssues.length}: "${issueData.name}"`
          )
        );

        const createdIssue = await createIssue(issueData);
        if (createdIssue) {
          console.log(chalk.green(`  ✅ Created: ${createdIssue.name}`));
          return { success: true, issue: createdIssue };
        } else {
          console.log(
            chalk.red(
              `  ❌ Failed to create: "${issueData.name}" - No response from API`
            )
          );
          return { success: false, issue: null, error: "No response from API" };
        }
      } catch (error) {
        console.log(
          chalk.red(
            `  ❌ Failed to create: "${issueData.name}" - ${error.message}`
          )
        );
        return { success: false, issue: null, error: error.message };
      }
    });

    // Wait for all issues in current batch to complete
    const batchResults = await Promise.all(batchPromises);

    // Process batch results
    batchResults.forEach((result) => {
      if (result.success && result.issue) {
        createdIssues.push(result.issue);
        successCount++;
      } else {
        errorCount++;
      }
    });

    console.log(
      chalk.blue(
        `  📊 Batch ${batchIndex + 1} completed: ${
          batchResults.filter((r) => r.success).length
        } success, ${batchResults.filter((r) => !r.success).length} failed`
      )
    );

    // Sleep between batches (except for the last batch)
    if (batchIndex < totalBatches - 1) {
      console.log(
        chalk.yellow(`  ⏳ Sleeping for ${sleepMs}ms before next batch...`)
      );
      await new Promise((resolve) => setTimeout(resolve, sleepMs));
    }
  }

  // Final summary
  console.log(chalk.green.bold(`\n📊 Batch Creation Summary:`));
  console.log(
    chalk.white(`  Total issues processed: ${preparedIssues.length}`)
  );
  console.log(chalk.white(`  Successfully created: ${successCount}`));
  console.log(chalk.white(`  Failed to create: ${errorCount}`));
  console.log(chalk.white(`  Total batches processed: ${totalBatches}`));

  return createdIssues;
}

async function createIssueTest() {
  console.log(chalk.blue.bold("🧪 Testing Issue Creation Process"));
  console.log(chalk.gray("=====================================\n"));

  let processToCreate = false;

  try {
    // Step 1: Load issues from JSON file
    console.log(chalk.blue("📄 Step 1: Loading issues from JSON file..."));
    const jsonIssuesData = loadIssuesFromJSON();
    const jsonIssues = jsonIssuesData.issues;

    // Step 2: Get all existing issues from API
    console.log(
      chalk.blue("\n🌐 Step 2: Fetching existing issues from API...")
    );
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
      chalk.blue(
        "\n🔍 Step 3: Comparing JSON sub-issues with existing issues..."
      )
    );
    const issuesToCreate = findIssuesToCreate(jsonIssues, existingIssues || []);

    if (issuesToCreate.length === 0) {
      console.log(
        chalk.green("🎉 All issues from JSON already exist in Plane!")
      );
      return;
    }

    if (issuesToCreate.length === jsonIssues.length) {
      processToCreate = true;

      console.log(
        chalk.yellow(
          `\n Can create all issues from JSON because some issues already exist in Plane`
        )
      );
    }

    console.log(
      chalk.yellow(`\n📋 Found ${issuesToCreate.length} issues to create:`)
    );

    // Step 4: Add issues to module
    // 4.1 get all modules and find target module by name "addIssuesToModuleName"
    const results = await getModules();
    const fetchedModules = results.results;
    const targetModule = findModuleByName(
      fetchedModules,
      addIssuesToModuleName
    );

    if (!targetModule) {
      console.log(chalk.red(`❌ Module not found: "${addIssuesToModuleName}"`));
      return;
    } else {
      console.log(
        chalk.green(
          `✅ Found module: "${targetModule.name}" (ID: ${targetModule.id})`
        )
      );
    }

    // 4.2 add issues to module
    // 4.2.1 create issues
    if (processToCreate) {
      const createdIssues = await createIssuesInBatches(
        issuesToCreate,
        BATCH_SIZE,
        SLEEP_MS
      );

      console.log("createdIssues", createdIssues);

      // 4.2.2 add issues to module
      if (createdIssues.length > 0) {
        const moduleAssignmentSuccess = await addIssuesToModule(
          targetModule.id,
          createdIssues.map((issue) => issue.id)
        );
      }
    }

    // const moduleAssignmentSuccess = await addIssuesToModuleByName(
    //   issuesToCreate,
    //   addIssuesToModuleName
    // );

    // // Step 3: Compare and find issues to create
    // console.log(
    //   chalk.blue("\n🔍 Step 3: Comparing JSON issues with existing issues...")
    // );
    // const issuesToCreate = findIssuesToCreate(jsonIssues, existingIssues || []);

    // if (issuesToCreate.length === 0) {
    //   console.log(
    //     chalk.green("🎉 All issues from JSON already exist in Plane!")
    //   );

    //   // Test module assignment with existing issues
    //   console.log(
    //     chalk.blue("\n🔗 Testing module assignment with existing issues...")
    //   );

    //   // Get all existing issues that match our JSON issues
    //   const existingMatchingIssues = existingIssues.filter((existingIssue) =>
    //     jsonIssues.some(
    //       (jsonIssue) =>
    //         jsonIssue.name.toLowerCase() === existingIssue.name.toLowerCase()
    //     )
    //   );

    //   if (existingMatchingIssues.length > 0) {
    //     console.log(
    //       chalk.blue(
    //         `Found ${existingMatchingIssues.length} existing issues to add to module`
    //       )
    //     );
    //     const moduleAssignmentSuccess = await addIssuesToModuleByName(
    //       existingMatchingIssues,
    //       addIssuesToModuleName
    //     );

    //     if (moduleAssignmentSuccess) {
    //       console.log(
    //         chalk.green("✅ All existing issues successfully added to module!")
    //       );
    //     } else {
    //       console.log(
    //         chalk.red("❌ Failed to add some or all issues to module")
    //       );
    //     }
    //   } else {
    //     console.log(
    //       chalk.yellow(
    //         "⚠️  No matching existing issues found for module assignment"
    //       )
    //     );
    //   }

    //   return;
    // }

    // // Check if ALL issues need to be created (none exist)
    // if (issuesToCreate.length === jsonIssues.length) {
    //   console.log(
    //     chalk.blue(
    //       `\n🚀 All ${jsonIssues.length} issues from JSON need to be created!`
    //     )
    //   );
    //   console.log(chalk.gray("Proceeding with full issue creation process..."));
    // } else {
    //   console.log(
    //     chalk.yellow(
    //       `\n📋 Partial creation needed: ${issuesToCreate.length} out of ${jsonIssues.length} issues need to be created`
    //     )
    //   );
    // }

    // console.log(
    //   chalk.yellow(`\n📋 Found ${issuesToCreate.length} issues to create:`)
    // );

    // // Step 4: Prepare issue creation data (without actually creating)
    // console.log(chalk.blue("\n🔧 Step 4: Preparing issue creation data..."));
    // const preparedIssues = [];

    // issuesToCreate.forEach((issueData, index) => {
    //   console.log(chalk.cyan(`\n  Issue ${index + 1}:`));
    //   const preparedData = prepareIssueCreation(issueData);
    //   preparedIssues.push({
    //     originalData: issueData,
    //     preparedData: preparedData,
    //   });
    // });

    // // Summary
    // console.log(chalk.green.bold("\n📊 Summary:"));
    // console.log(chalk.white(`  Total issues in JSON: ${jsonIssues.length}`));
    // console.log(
    //   chalk.white(`  Existing issues in Plane: ${existingIssues?.length || 0}`)
    // );
    // console.log(chalk.white(`  Issues to create: ${issuesToCreate.length}`));
    // console.log(
    //   chalk.white(
    //     `  Issues already exist: ${jsonIssues.length - issuesToCreate.length}`
    //   )
    // );

    // // Optional: Show what would be created (without actually creating)
    // console.log(chalk.blue.bold("\n🚀 Ready to create issues:"));
    // preparedIssues.forEach((issue, index) => {
    //   console.log(chalk.cyan(`  ${index + 1}. "${issue.preparedData.name}"`));
    //   console.log(chalk.gray(`     Priority: ${issue.preparedData.priority}`));
    //   console.log(
    //     chalk.gray(`     Completed: ${issue.preparedData.markdown.isCompleted}`)
    //   );
    //   console.log(chalk.gray(`     Draft: ${issue.preparedData.is_draft}`));
    // });

    // console.log(chalk.green.bold("\n✅ Issue creation preparation completed!"));
    // console.log(
    //   chalk.yellow(
    //     "💡 To actually create issues, uncomment the creation code below"
    //   )
    // );

    // Uncomment the following lines to actually create issues:
    // console.log(chalk.blue("\n🚀 Creating issues..."));
    // let successCount = 0;
    // let errorCount = 0;
    // const createdIssues = [];

    // for (const issue of preparedIssues) {
    //   try {
    //     console.log(chalk.blue(`Creating: "${issue.preparedData.name}"...`));
    //     const createdIssue = await createIssue(issue.preparedData);
    //     if (createdIssue) {
    //       console.log(chalk.green(`✅ Created: ${createdIssue.name}`));
    //       createdIssues.push(createdIssue);
    //       successCount++;
    //     }
    //   } catch (error) {
    //     console.log(
    //       chalk.red(
    //         `❌ Failed to create "${issue.preparedData.name}": ${error.message}`
    //       )
    //     );
    //     errorCount++;
    //   }
    // }

    // console.log(chalk.green.bold("\n📊 Creation Summary:"));
    // console.log(chalk.white(`  Successfully created: ${successCount}`));
    // console.log(chalk.white(`  Failed to create: ${errorCount}`));
    // console.log(chalk.white(`  Total processed: ${preparedIssues.length}`));

    // // Step 5: Add created issues to the specified module
    // if (createdIssues.length > 0) {
    //   console.log(chalk.blue("\n🔗 Step 5: Adding issues to module..."));
    //   const moduleAssignmentSuccess = await addIssuesToModuleByName(
    //     createdIssues,
    //     addIssuesToModuleName
    //   );

    //   if (moduleAssignmentSuccess) {
    //     console.log(chalk.green("✅ All issues successfully added to module!"));
    //   } else {
    //     console.log(chalk.red("❌ Failed to add some or all issues to module"));
    //   }
    // } else {
    //   console.log(
    //     chalk.yellow("⚠️  No issues were created, skipping module assignment")
    //   );
    // }
  } catch (error) {
    console.log(chalk.red(`❌ Test failed: ${error.message}`));
  }
}

createIssueTest();
