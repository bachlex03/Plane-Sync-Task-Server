import path from "path";
import chalk from "chalk";
import fs from "fs";
import "dotenv/config";

import { getModules, createModule } from "../src/apis/module.api.js";
import { processBatches, createApiBatchProcessor } from "../src/utils/utils.js";

const outputFolder = path.resolve(process.cwd(), "output");
const modulesJSONPath = path.resolve(outputFolder, "backend-modules.json");

// Batching configuration
const BATCH_SIZE = 20; // 20 modules per batch
const SLEEP_MS = 2000; // 2 seconds sleep between batches

/**
 * Load modules from JSON file
 * @returns {Object} Modules data from JSON file
 */
function loadModulesFromJSON() {
  try {
    if (!fs.existsSync(modulesJSONPath)) {
      throw new Error(`JSON file not found: ${modulesJSONPath}`);
    }

    const jsonContent = fs.readFileSync(modulesJSONPath, "utf8");
    const modulesData = JSON.parse(jsonContent);

    console.log(
      chalk.green(`✅ Loaded ${modulesData.modules.length} modules from JSON`)
    );
    return modulesData;
  } catch (error) {
    console.log(chalk.red(`❌ Error loading JSON file: ${error.message}`));
    throw error;
  }
}

/**
 * Compare modules from JSON with existing modules from API
 * @param {Array} jsonModules - Modules from JSON file
 * @param {Array} existingModules - Modules from API
 * @returns {Array} Modules that need to be created
 */
function findModulesToCreate(jsonModules, existingModules) {
  const modulesToCreate = [];

  jsonModules.forEach((jsonModule) => {
    const moduleName = jsonModule.payload.name;
    const exists = existingModules.some(
      (existingModule) =>
        existingModule.name.toLowerCase() === moduleName.toLowerCase()
    );

    if (!exists) {
      modulesToCreate.push(jsonModule);
      console.log(chalk.yellow(`  📝 Module to create: "${moduleName}"`));
    } else {
      console.log(chalk.gray(`  ✅ Module already exists: "${moduleName}"`));
    }
  });

  return modulesToCreate;
}

/**
 * Create a single module (without actually calling the API)
 * @param {Object} moduleData - Module data to create
 * @returns {Object} Prepared module creation data
 */
function prepareModuleCreation(moduleData) {
  const creationData = {
    name: moduleData.payload.name,
    description: moduleData.payload.description || "",
    description_text: moduleData.payload.description_text,
    description_html: moduleData.payload.description_html,
    start_date: moduleData.payload.start_date,
    target_date: moduleData.payload.target_date,
    status: moduleData.payload.status || "planned",
    sort_order: moduleData.payload.sort_order,
    // Note: We don't include id, created_at, updated_at as these are set by the API
    // We also don't include created_by, updated_by, project, workspace as these are handled by the API
  };

  console.log(
    chalk.cyan(
      `  🔧 Prepared module creation data for: "${moduleData.payload.name}"`
    )
  );
  console.log(chalk.gray(`    Sort Order: ${creationData.sort_order}`));
  console.log(chalk.gray(`    Status: ${creationData.status}`));

  return creationData;
}

async function createModuleTest() {
  console.log(chalk.blue.bold("🧪 Testing Module Creation Process"));
  console.log(chalk.gray("=====================================\n"));

  try {
    // Step 1: Load modules from JSON file
    console.log(chalk.blue("📄 Step 1: Loading modules from JSON file..."));
    const jsonModulesData = loadModulesFromJSON();
    const jsonModules = jsonModulesData.modules;

    // Step 2: Get all existing modules from API
    console.log(
      chalk.blue("\n🌐 Step 2: Fetching existing modules from API...")
    );
    const existingModules = await getModules();

    if (!existingModules) {
      console.log(chalk.yellow("⚠️  No existing modules found or API error"));
      console.log(
        chalk.blue("📝 All modules from JSON will be considered for creation")
      );
    } else {
      console.log(
        chalk.green(
          `✅ Found ${existingModules.length} existing modules in Plane`
        )
      );
    }

    // Step 3: Compare and find modules to create
    console.log(
      chalk.blue("\n🔍 Step 3: Comparing JSON modules with existing modules...")
    );
    const modulesToCreate = findModulesToCreate(
      jsonModules,
      existingModules || []
    );

    if (modulesToCreate.length === 0) {
      console.log(
        chalk.green("🎉 All modules from JSON already exist in Plane!")
      );
      return;
    }

    console.log(
      chalk.yellow(`\n📋 Found ${modulesToCreate.length} modules to create:`)
    );

    // Step 4: Prepare module creation data (without actually creating)
    console.log(chalk.blue("\n🔧 Step 4: Preparing module creation data..."));
    const preparedModules = [];

    modulesToCreate.forEach((moduleData, index) => {
      console.log(chalk.cyan(`\n  Module ${index + 1}:`));
      const preparedData = prepareModuleCreation(moduleData);
      preparedModules.push({
        originalData: moduleData,
        preparedData: preparedData,
      });
    });

    // Summary
    console.log(chalk.green.bold("\n📊 Summary:"));
    console.log(chalk.white(`  Total modules in JSON: ${jsonModules.length}`));
    console.log(
      chalk.white(
        `  Existing modules in Plane: ${existingModules?.length || 0}`
      )
    );
    console.log(chalk.white(`  Modules to create: ${modulesToCreate.length}`));
    console.log(
      chalk.white(
        `  Modules already exist: ${
          jsonModules.length - modulesToCreate.length
        }`
      )
    );

    // Optional: Show what would be created (without actually creating)
    console.log(chalk.blue.bold("\n🚀 Ready to create modules:"));
    preparedModules.forEach((module, index) => {
      console.log(chalk.cyan(`  ${index + 1}. "${module.preparedData.name}"`));
      console.log(
        chalk.gray(`     Sort Order: ${module.preparedData.sort_order}`)
      );
      console.log(chalk.gray(`     Status: ${module.preparedData.status}`));
    });

    console.log(
      chalk.green.bold("\n✅ Module creation preparation completed!")
    );
    console.log(
      chalk.yellow(
        "💡 To actually create modules, uncomment the creation code below"
      )
    );

    // Create modules using batching strategy
    console.log(chalk.blue("\n🚀 Creating modules using batching strategy..."));

    // Extract prepared data for batching
    const modulesToCreateData = preparedModules.map(
      (module) => module.preparedData
    );

    // Create API processor function
    const apiProcessor = createApiBatchProcessor(createModule);

    // Process modules in batches
    const results = await processBatches(modulesToCreateData, apiProcessor, {
      batchSize: BATCH_SIZE,
      sleepMs: SLEEP_MS,
      onBatchStart: (batchNumber, totalBatches, batchSize) => {
        console.log(
          chalk.blue.bold(
            `\n📦 Batch ${batchNumber}/${totalBatches}: Creating ${batchSize} modules concurrently...`
          )
        );
      },
      onItemStart: (module, index, total) => {
        console.log(
          chalk.blue(`📤 Creating module ${index}/${total}: "${module.name}"`)
        );
      },
      onItemSuccess: (module, result, index) => {
        console.log(
          chalk.green(`✅ Created module ${index}: "${module.name}"`)
        );
      },
      onItemError: (module, error, index) => {
        console.log(
          chalk.red(
            `❌ Failed to create module ${index}: "${module.name}" - ${error.message}`
          )
        );
      },
      onBatchComplete: (batchNumber, stats, batchResults) => {
        console.log(chalk.blue.bold(`\n📊 Batch ${batchNumber} Results:`));
        console.log(chalk.green(`✅ Successful: ${stats.successful}`));
        console.log(chalk.red(`❌ Failed: ${stats.failed}`));
        console.log(chalk.cyan(`⏱️  Batch time: ${stats.batchTime}ms`));
      },
      onAllComplete: (finalResults) => {
        console.log(
          chalk.green.bold(`\n🎉 Completed all module creation batches!`)
        );
        console.log(chalk.blue.bold(`\n📊 Final Results:`));
        console.log(
          chalk.green(`✅ Total Successful: ${finalResults.successful}`)
        );
        console.log(chalk.red(`❌ Total Failed: ${finalResults.failed}`));
        console.log(chalk.cyan(`⏱️  Total time: ${finalResults.totalTime}ms`));
      },
    });
  } catch (error) {
    console.log(chalk.red(`❌ Test failed: ${error.message}`));
  }
}

createModuleTest();
