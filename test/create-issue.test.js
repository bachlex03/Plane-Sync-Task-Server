import path from "path";
import chalk from "chalk";
import fs from "fs";
import "dotenv/config";

import { getIssues, createIssue } from "../src/apis/issue.api.js";
import { getModules, addIssuesToModule } from "../src/apis/module.api.js";

const outputFolder = path.resolve(process.cwd(), "output");
const issuesJSONPath = path.resolve(outputFolder, "backend-issues-phase1.json");

const addIssuesToModuleName = "Phase 1: Nền tảng & Khởi tạo kiến trúc cơ bản";

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
 * Create a single issue (without actually calling the API)
 * @param {Object} issueData - Issue data to create
 * @returns {Object} Prepared issue creation data
 */
function prepareIssueCreation(issueData) {
  const creationData = {
    name: issueData.name,
    description_html: issueData.payload.description_html || "<p></p>",
    description_stripped: issueData.payload.description_stripped || "",
    priority: issueData.payload.priority || "none",
    start_date: issueData.payload.start_date,
    target_date: issueData.payload.target_date,
    estimate_point: issueData.payload.estimate_point,
    is_draft: issueData.payload.is_draft || false,
    labels: issueData.payload.labels || [], // Include labels from JSON
    // Note: We don't include id, created_at, updated_at as these are set by the API
    // We also don't include created_by, updated_by, project, workspace as these are handled by the API
    // State will be determined by is_completed status
    markdown: {
      isCompleted: issueData.is_completed || false,
      raw_text: issueData.raw_text,
    },
  };

  console.log(
    chalk.cyan(`  🔧 Prepared issue creation data for: "${issueData.name}"`)
  );
  console.log(chalk.gray(`    Priority: ${creationData.priority}`));
  console.log(
    chalk.gray(`    Completed: ${creationData.markdown.isCompleted}`)
  );
  console.log(chalk.gray(`    Draft: ${creationData.is_draft}`));
  console.log(
    chalk.gray(
      `    Labels: ${
        creationData.labels.length > 0 ? creationData.labels.join(", ") : "None"
      }`
    )
  );

  return creationData;
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

/**
 * Add created issues to the specified module
 * @param {Array} createdIssues - Array of created issue objects
 * @param {string} moduleName - Module name to add issues to
 * @returns {boolean} Success status
 */
async function addIssuesToModuleByName(createdIssues, moduleName) {
  try {
    console.log(chalk.blue(`\n🔗 Adding issues to module: "${moduleName}"`));

    // Get all modules to find the target module
    const modules = await getModules();
    if (!modules) {
      console.log(chalk.red("❌ Failed to fetch modules"));
      return false;
    }

    // Find the target module
    const targetModule = findModuleByName(modules, moduleName);
    if (!targetModule) {
      console.log(chalk.red(`❌ Module not found: "${moduleName}"`));
      console.log(chalk.gray("Available modules:"));
      modules.forEach((mod) => {
        console.log(chalk.gray(`  - "${mod.name}"`));
      });
      return false;
    }

    console.log(
      chalk.green(
        `✅ Found module: "${targetModule.name}" (ID: ${targetModule.id})`
      )
    );

    // Extract issue IDs from created issues
    const issueIds = createdIssues
      .filter((issue) => issue && issue.id) // Filter out any null/undefined issues
      .map((issue) => issue.id);

    if (issueIds.length === 0) {
      console.log(
        chalk.yellow("⚠️  No valid issue IDs found to add to module")
      );
      return false;
    }

    console.log(
      chalk.blue(`📋 Adding ${issueIds.length} issue(s) to module...`)
    );

    // Add issues to module
    const result = await addIssuesToModule(targetModule.id, issueIds);

    if (result) {
      console.log(
        chalk.green(
          `✅ Successfully added ${issueIds.length} issue(s) to module`
        )
      );
      return true;
    } else {
      console.log(chalk.red("❌ Failed to add issues to module"));
      return false;
    }
  } catch (error) {
    console.log(
      chalk.red(`❌ Error adding issues to module: ${error.message}`)
    );
    return false;
  }
}

async function createIssueTest() {
  console.log(chalk.blue.bold("🧪 Testing Issue Creation Process"));
  console.log(chalk.gray("=====================================\n"));

  try {
    // Step 1: Load issues from JSON file
    console.log(chalk.blue("📄 Step 1: Loading issues from JSON file..."));
    const jsonIssuesData = loadIssuesFromJSON();
    const jsonIssues = jsonIssuesData.issues;

    // Step 2: Get all existing issues from API
    console.log(
      chalk.blue("\n🌐 Step 2: Fetching existing issues from API...")
    );
    const existingIssues = await getIssues();

    if (!existingIssues) {
      console.log(chalk.yellow("⚠️  No existing issues found or API error"));
      console.log(
        chalk.blue("📝 All issues from JSON will be considered for creation")
      );
    } else {
      console.log(
        chalk.green(
          `✅ Found ${existingIssues.length} existing issues in Plane`
        )
      );
    }

    // Step 3: Compare and find issues to create
    console.log(
      chalk.blue("\n🔍 Step 3: Comparing JSON issues with existing issues...")
    );
    const issuesToCreate = findIssuesToCreate(jsonIssues, existingIssues || []);

    if (issuesToCreate.length === 0) {
      console.log(
        chalk.green("🎉 All issues from JSON already exist in Plane!")
      );

      // Test module assignment with existing issues
      console.log(
        chalk.blue("\n🔗 Testing module assignment with existing issues...")
      );

      // Get all existing issues that match our JSON issues
      const existingMatchingIssues = existingIssues.filter((existingIssue) =>
        jsonIssues.some(
          (jsonIssue) =>
            jsonIssue.name.toLowerCase() === existingIssue.name.toLowerCase()
        )
      );

      if (existingMatchingIssues.length > 0) {
        console.log(
          chalk.blue(
            `Found ${existingMatchingIssues.length} existing issues to add to module`
          )
        );
        const moduleAssignmentSuccess = await addIssuesToModuleByName(
          existingMatchingIssues,
          addIssuesToModuleName
        );

        if (moduleAssignmentSuccess) {
          console.log(
            chalk.green("✅ All existing issues successfully added to module!")
          );
        } else {
          console.log(
            chalk.red("❌ Failed to add some or all issues to module")
          );
        }
      } else {
        console.log(
          chalk.yellow(
            "⚠️  No matching existing issues found for module assignment"
          )
        );
      }

      return;
    }

    // Check if ALL issues need to be created (none exist)
    if (issuesToCreate.length === jsonIssues.length) {
      console.log(
        chalk.blue(
          `\n🚀 All ${jsonIssues.length} issues from JSON need to be created!`
        )
      );
      console.log(chalk.gray("Proceeding with full issue creation process..."));
    } else {
      console.log(
        chalk.yellow(
          `\n📋 Partial creation needed: ${issuesToCreate.length} out of ${jsonIssues.length} issues need to be created`
        )
      );
    }

    console.log(
      chalk.yellow(`\n📋 Found ${issuesToCreate.length} issues to create:`)
    );

    // Step 4: Prepare issue creation data (without actually creating)
    console.log(chalk.blue("\n🔧 Step 4: Preparing issue creation data..."));
    const preparedIssues = [];

    issuesToCreate.forEach((issueData, index) => {
      console.log(chalk.cyan(`\n  Issue ${index + 1}:`));
      const preparedData = prepareIssueCreation(issueData);
      preparedIssues.push({
        originalData: issueData,
        preparedData: preparedData,
      });
    });

    // Summary
    console.log(chalk.green.bold("\n📊 Summary:"));
    console.log(chalk.white(`  Total issues in JSON: ${jsonIssues.length}`));
    console.log(
      chalk.white(`  Existing issues in Plane: ${existingIssues?.length || 0}`)
    );
    console.log(chalk.white(`  Issues to create: ${issuesToCreate.length}`));
    console.log(
      chalk.white(
        `  Issues already exist: ${jsonIssues.length - issuesToCreate.length}`
      )
    );

    // Optional: Show what would be created (without actually creating)
    console.log(chalk.blue.bold("\n🚀 Ready to create issues:"));
    preparedIssues.forEach((issue, index) => {
      console.log(chalk.cyan(`  ${index + 1}. "${issue.preparedData.name}"`));
      console.log(chalk.gray(`     Priority: ${issue.preparedData.priority}`));
      console.log(
        chalk.gray(`     Completed: ${issue.preparedData.markdown.isCompleted}`)
      );
      console.log(chalk.gray(`     Draft: ${issue.preparedData.is_draft}`));
    });

    console.log(chalk.green.bold("\n✅ Issue creation preparation completed!"));
    console.log(
      chalk.yellow(
        "💡 To actually create issues, uncomment the creation code below"
      )
    );

    // Uncomment the following lines to actually create issues:
    console.log(chalk.blue("\n🚀 Creating issues..."));
    let successCount = 0;
    let errorCount = 0;
    const createdIssues = [];

    for (const issue of preparedIssues) {
      try {
        console.log(chalk.blue(`Creating: "${issue.preparedData.name}"...`));
        const createdIssue = await createIssue(issue.preparedData);
        if (createdIssue) {
          console.log(chalk.green(`✅ Created: ${createdIssue.name}`));
          createdIssues.push(createdIssue);
          successCount++;
        }
      } catch (error) {
        console.log(
          chalk.red(
            `❌ Failed to create "${issue.preparedData.name}": ${error.message}`
          )
        );
        errorCount++;
      }
    }

    console.log(chalk.green.bold("\n📊 Creation Summary:"));
    console.log(chalk.white(`  Successfully created: ${successCount}`));
    console.log(chalk.white(`  Failed to create: ${errorCount}`));
    console.log(chalk.white(`  Total processed: ${preparedIssues.length}`));

    // Step 5: Add created issues to the specified module
    if (createdIssues.length > 0) {
      console.log(chalk.blue("\n🔗 Step 5: Adding issues to module..."));
      const moduleAssignmentSuccess = await addIssuesToModuleByName(
        createdIssues,
        addIssuesToModuleName
      );

      if (moduleAssignmentSuccess) {
        console.log(chalk.green("✅ All issues successfully added to module!"));
      } else {
        console.log(chalk.red("❌ Failed to add some or all issues to module"));
      }
    } else {
      console.log(
        chalk.yellow("⚠️  No issues were created, skipping module assignment")
      );
    }
  } catch (error) {
    console.log(chalk.red(`❌ Test failed: ${error.message}`));
  }
}

createIssueTest();
