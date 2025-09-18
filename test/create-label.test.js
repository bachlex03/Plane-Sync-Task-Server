import path from "path";
import chalk from "chalk";
import fs from "fs";
import "dotenv/config";

import { getLabels, createLabel } from "../src/apis/label.api.js";

const outputFolder = path.resolve(process.cwd(), "output");
const modulesJSONPath = path.resolve(outputFolder, "backend-modules.json");

/**
 * Load modules from JSON file and extract unique labels
 * @returns {Array} Array of unique labels from JSON file
 */
function loadLabelsFromJSON() {
  try {
    if (!fs.existsSync(modulesJSONPath)) {
      throw new Error(`JSON file not found: ${modulesJSONPath}`);
    }

    const jsonContent = fs.readFileSync(modulesJSONPath, "utf8");
    const modulesData = JSON.parse(jsonContent);

    // Extract unique labels from modules
    const labels = [];
    const seenLabels = new Set();

    modulesData.modules.forEach((module) => {
      if (module.label && module.label.name) {
        const labelName = module.label.name;
        if (!seenLabels.has(labelName)) {
          seenLabels.add(labelName);
          labels.push({
            name: labelName,
            color: module.label.payload.color || "#3b82f6",
            description: module.label.payload.description || "",
            raw_text: module.label.raw_text,
          });
        }
      }
    });

    console.log(
      chalk.green(`✅ Loaded ${labels.length} unique labels from JSON`)
    );
    return labels;
  } catch (error) {
    console.log(chalk.red(`❌ Error loading JSON file: ${error.message}`));
    throw error;
  }
}

/**
 * Compare labels from JSON with existing labels from API
 * @param {Array} jsonLabels - Labels from JSON file
 * @param {Array} existingLabels - Labels from API
 * @returns {Array} Labels that need to be created
 */
function findLabelsToCreate(jsonLabels, existingLabels) {
  const labelsToCreate = [];

  jsonLabels.forEach((jsonLabel) => {
    const labelName = jsonLabel.name;
    const exists = existingLabels.some(
      (existingLabel) =>
        existingLabel.name.toLowerCase() === labelName.toLowerCase()
    );

    if (!exists) {
      labelsToCreate.push(jsonLabel);
      console.log(chalk.yellow(`  📝 Label to create: "${labelName}"`));
    } else {
      console.log(chalk.gray(`  ✅ Label already exists: "${labelName}"`));
    }
  });

  return labelsToCreate;
}

/**
 * Generate a random hex color
 * @returns {string} Random hex color
 */
function generateRandomColor() {
  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E9",
    "#F8C471",
    "#82E0AA",
    "#F1948A",
    "#85C1E9",
    "#D7BDE2",
    "#A9DFBF",
    "#F9E79F",
    "#AED6F1",
    "#D5DBDB",
    "#FADBD8",
    "#D1F2EB",
    "#FCF3CF",
    "#E8DAEF",
    "#D5F4E6",
    "#FEF9E7",
    "#EBF5FB",
    "#FDF2E9",
    "#EAF2F8",
    "#F4F6F6",
    "#FAD7A0",
    "#A3E4D7",
    "#F9E79F",
    "#D2B4DE",
    "#AED6F1",
    "#A9DFBF",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Get unique colors for labels, avoiding duplicates with existing labels
 * @param {Array} labelsToCreate - Labels to create
 * @param {Array} existingLabels - Existing labels from API
 * @returns {Array} Labels with unique colors assigned
 */
function assignUniqueColors(labelsToCreate, existingLabels) {
  const existingColors = new Set();

  // Collect existing colors
  existingLabels.forEach((label) => {
    if (label.color && label.color.trim() !== "") {
      existingColors.add(label.color.toUpperCase());
    }
  });

  // Assign unique colors to new labels
  return labelsToCreate.map((label) => {
    let color;
    let attempts = 0;
    const maxAttempts = 50; // Prevent infinite loop

    do {
      color = generateRandomColor();
      attempts++;
    } while (existingColors.has(color.toUpperCase()) && attempts < maxAttempts);

    // If we couldn't find a unique color after max attempts, use a fallback
    if (attempts >= maxAttempts) {
      color =
        "#" +
        Math.floor(Math.random() * 16777215)
          .toString(16)
          .padStart(6, "0");
    }

    existingColors.add(color.toUpperCase()); // Add to set to avoid duplicates within new labels

    return {
      ...label,
      color: color,
    };
  });
}

/**
 * Prepare a single label for creation (without actually calling the API)
 * @param {Object} labelData - Label data to create
 * @returns {Object} Prepared label creation data
 */
function prepareLabelCreation(labelData) {
  const creationData = {
    name: labelData.name,
    color: labelData.color,
    description: labelData.description || "",
    // Note: We don't include id, created_at, updated_at as these are set by the API
    // We also don't include created_by, updated_by, project, workspace as these are handled by the API
  };

  console.log(
    chalk.cyan(`  🔧 Prepared label creation data for: "${labelData.name}"`)
  );
  console.log(chalk.gray(`    Color: ${creationData.color}`));
  console.log(chalk.gray(`    Description: "${creationData.description}"`));

  return creationData;
}

async function createLabelTest() {
  console.log(chalk.blue.bold("🧪 Testing Label Creation Process"));
  console.log(chalk.gray("=====================================\n"));

  try {
    // Step 1: Load labels from JSON file
    console.log(chalk.blue("📄 Step 1: Loading labels from JSON file..."));
    const jsonLabels = loadLabelsFromJSON();

    // Step 2: Get all existing labels from API
    console.log(
      chalk.blue("\n🌐 Step 2: Fetching existing labels from API...")
    );
    const existingLabels = await getLabels();

    if (!existingLabels) {
      console.log(chalk.yellow("⚠️  No existing labels found or API error"));
      console.log(
        chalk.blue("📝 All labels from JSON will be considered for creation")
      );
    } else {
      console.log(
        chalk.green(
          `✅ Found ${existingLabels.length} existing labels in Plane`
        )
      );
    }

    // Step 3: Compare and find labels to create
    console.log(
      chalk.blue("\n🔍 Step 3: Comparing JSON labels with existing labels...")
    );
    const labelsToCreate = findLabelsToCreate(jsonLabels, existingLabels || []);

    if (labelsToCreate.length === 0) {
      console.log(
        chalk.green("🎉 All labels from JSON already exist in Plane!")
      );
      return;
    }

    console.log(
      chalk.yellow(`\n📋 Found ${labelsToCreate.length} labels to create:`)
    );

    // Step 4: Assign unique colors to labels
    console.log(
      chalk.blue("\n🎨 Step 4: Assigning unique colors to labels...")
    );
    const labelsWithColors = assignUniqueColors(
      labelsToCreate,
      existingLabels || []
    );

    console.log(
      chalk.green(
        `✅ Assigned unique colors to ${labelsWithColors.length} labels`
      )
    );

    // Step 5: Prepare label creation data (without actually creating)
    console.log(chalk.blue("\n🔧 Step 5: Preparing label creation data..."));
    const preparedLabels = [];

    labelsWithColors.forEach((labelData, index) => {
      console.log(chalk.cyan(`\n  Label ${index + 1}:`));
      const preparedData = prepareLabelCreation(labelData);
      preparedLabels.push({
        originalData: labelData,
        preparedData: preparedData,
      });
    });

    // Summary
    console.log(chalk.green.bold("\n📊 Summary:"));
    console.log(chalk.white(`  Total labels in JSON: ${jsonLabels.length}`));
    console.log(
      chalk.white(`  Existing labels in Plane: ${existingLabels?.length || 0}`)
    );
    console.log(chalk.white(`  Labels to create: ${labelsToCreate.length}`));
    console.log(
      chalk.white(
        `  Labels already exist: ${jsonLabels.length - labelsToCreate.length}`
      )
    );

    // Optional: Show what would be created (without actually creating)
    console.log(chalk.blue.bold("\n🚀 Ready to create labels:"));
    preparedLabels.forEach((label, index) => {
      console.log(chalk.cyan(`  ${index + 1}. "${label.preparedData.name}"`));
      console.log(
        chalk.gray(`     Color: ${label.preparedData.color} ████████`)
      );
      console.log(
        chalk.gray(`     Description: "${label.preparedData.description}"`)
      );
    });

    console.log(chalk.green.bold("\n✅ Label creation preparation completed!"));
    console.log(
      chalk.yellow(
        "💡 To actually create labels, uncomment the creation code below"
      )
    );

    // Uncomment the following lines to actually create labels:
    console.log(chalk.blue("\n🚀 Creating labels..."));
    let successCount = 0;
    let errorCount = 0;

    for (const label of preparedLabels) {
      try {
        console.log(chalk.blue(`Creating: "${label.preparedData.name}"...`));
        const createdLabel = await createLabel(label.preparedData);
        if (createdLabel) {
          console.log(chalk.green(`✅ Created: ${createdLabel.name}`));
          successCount++;
        }
      } catch (error) {
        console.log(
          chalk.red(
            `❌ Failed to create "${label.preparedData.name}": ${error.message}`
          )
        );
        errorCount++;
      }
    }

    console.log(chalk.green.bold("\n📊 Creation Summary:"));
    console.log(chalk.white(`  Successfully created: ${successCount}`));
    console.log(chalk.white(`  Failed to create: ${errorCount}`));
    console.log(chalk.white(`  Total processed: ${preparedLabels.length}`));
  } catch (error) {
    console.log(chalk.red(`❌ Test failed: ${error.message}`));
  }
}

createLabelTest();
