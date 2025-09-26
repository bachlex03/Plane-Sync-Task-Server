import path from "path";
import chalk from "chalk";
import fs from "fs";
import "dotenv/config";

import { getModules, createModule } from "../src/apis/module.api.js";

const outputFolder = path.resolve(process.cwd(), "output");
const modulesJSONPath = path.resolve(outputFolder, "backend-modules.json");

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

  // If existingModules is not an array or is empty, all modules need to be created
  if (
    !existingModules ||
    !Array.isArray(existingModules) ||
    existingModules.length === 0
  ) {
    console.log(
      chalk.yellow(
        "  📝 No existing modules found, all modules will be created"
      )
    );
    return jsonModules;
  }

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

    if (!existingModules || !Array.isArray(existingModules)) {
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

    // Show what will be created
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

    // Create modules normally (one by one)
    console.log(chalk.blue("\n🚀 Creating modules..."));

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < preparedModules.length; i++) {
      const module = preparedModules[i];
      const moduleData = module.preparedData;

      try {
        console.log(
          chalk.blue(
            `📤 Creating module ${i + 1}/${preparedModules.length}: "${
              moduleData.name
            }"`
          )
        );

        const result = await createModule(moduleData);

        if (result) {
          console.log(
            chalk.green(`✅ Created module ${i + 1}: "${moduleData.name}"`)
          );
          successCount++;
        } else {
          console.log(
            chalk.red(
              `❌ Failed to create module ${i + 1}: "${
                moduleData.name
              }" - No result returned`
            )
          );
          failCount++;
        }
      } catch (error) {
        console.log(
          chalk.red(
            `❌ Failed to create module ${i + 1}: "${moduleData.name}" - ${
              error.message
            }`
          )
        );
        failCount++;
      }

      // Small delay between requests to avoid overwhelming the API
      if (i < preparedModules.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Final results
    console.log(chalk.green.bold(`\n🎉 Completed all module creation!`));
    console.log(chalk.blue.bold(`\n📊 Final Results:`));
    console.log(chalk.green(`✅ Total Successful: ${successCount}`));
    console.log(chalk.red(`❌ Total Failed: ${failCount}`));
  } catch (error) {
    console.log(chalk.red(`❌ Test failed: ${error.message}`));
  }
}

createModuleTest();
