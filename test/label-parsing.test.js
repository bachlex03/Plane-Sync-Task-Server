import path from "path";
import chalk from "chalk";
import "dotenv/config";

import { markdownParser } from "../src/utils/markdown-parser.js";
import { extractLabels, validateLabel } from "../src/utils/label-extractor.js";
import { createLabel, getLabels } from "../src/apis/label.api.js";

const checklistFolder = path.resolve(process.cwd(), "checklist-example");
const markdownFile = path.resolve(checklistFolder, "checklist-example.md");

async function labelParsingTest() {
  console.log(chalk.blue.bold("🧪 Testing Label Extraction from Markdown"));
  console.log(chalk.gray("==========================================\n"));

  // Test 1: Basic AST parsing
  let ast = null;

  console.log(chalk.blue("\n📄 Test 1: Basic AST parsing..."));
  try {
    ast = await markdownParser(markdownFile);
    console.log(chalk.green("✅ AST parsing successful"));
    console.log(chalk.gray("AST type:", ast.type));
    console.log(chalk.gray("Children count:", ast.children?.length || 0));
  } catch (error) {
    console.log(chalk.red("❌ AST parsing failed:"), error.message);
    return;
  }

  // Test 2: Label extraction
  console.log(chalk.blue("\n🏷️  Test 2: Label extraction..."));
  try {
    const labels = extractLabels(ast);
    console.log(chalk.green("✅ Label extraction successful"));
    console.log(chalk.gray("Extracted labels count:", labels.length));

    if (labels.length > 0) {
      console.log(chalk.yellow("\n🏷️  Extracted labels:"));
      labels.forEach((label, index) => {
        console.log(chalk.cyan(`  Label ${index + 1}:`));
        console.log(chalk.white(`    Name: "${label.name}"`));
        console.log(chalk.white(`    Color: ${label.color}`));
        console.log(chalk.white(`    Raw Text: "${label.markdown.rawText}"`));
        console.log(chalk.white(`    Position: ${label.markdown.position}`));
        console.log();
      });
    }
  } catch (error) {
    console.log(chalk.red("❌ Label extraction failed:"), error.message);
    return;
  }

  // Test 3: Label validation
  console.log(chalk.blue("\n✅ Test 3: Label validation..."));
  try {
    const labels = extractLabels(ast);
    console.log(chalk.green("✅ Label validation test"));

    labels.forEach((label, index) => {
      const isValid = validateLabel(label);
      const status = isValid
        ? chalk.green("✅ Valid")
        : chalk.red("❌ Invalid");
      console.log(chalk.gray(`  Label ${index + 1}: ${status}`));

      if (!isValid) {
        console.log(chalk.red("    Validation failed for label:"), label);
      }
    });
  } catch (error) {
    console.log(chalk.red("❌ Label validation failed:"), error.message);
    return;
  }

  // Test 4: Test Plane API integration (create label)
  const byPassCreateLabel = false;
  if (!byPassCreateLabel) {
    console.log(chalk.blue("\n🚀 Test 4: Testing Plane API label creation..."));
    try {
      const labels = extractLabels(ast);
      if (labels.length > 0) {
        const createdLabel = await createLabel(labels[0]);
        if (createdLabel) {
          console.log(chalk.green("✅ Plane API label creation successful"));
          console.log(chalk.gray("Created label:", createdLabel.name));
          console.log(chalk.gray("Label ID:", createdLabel.id));
        }
      } else {
        console.log(chalk.yellow("⚠️  No labels to create"));
      }
    } catch (error) {
      console.log(
        chalk.red("❌ Plane API label creation failed:"),
        error.message
      );
    }
  }

  // Test 5: Test Plane API integration (get labels)
  console.log(chalk.blue("\n📋 Test 5: Testing Plane API label retrieval..."));
  try {
    const existingLabels = await getLabels();
    if (existingLabels && existingLabels.length > 0) {
      console.log(chalk.green("✅ Plane API label retrieval successful"));
      console.log(
        chalk.gray(`Found ${existingLabels.length} existing label(s)`)
      );

      console.log(chalk.yellow("\n🏷️  Existing labels in Plane:"));
      existingLabels.forEach((label, index) => {
        console.log(chalk.cyan(`  Label ${index + 1}:`));
        console.log(chalk.white(`    Name: "${label.name}"`));
        console.log(chalk.white(`    ID: ${label.id}`));
        console.log(chalk.white(`    Color: ${label.color || "N/A"}`));
        console.log(chalk.white(`    Created: ${label.created_at || "N/A"}`));
        console.log();
      });
    } else {
      console.log(chalk.yellow("⚠️  No existing labels found in Plane"));
    }
  } catch (error) {
    console.log(
      chalk.red("❌ Plane API label retrieval failed:"),
      error.message
    );
  }

  console.log(chalk.green.bold("\n🎉 All label tests completed!"));
}

labelParsingTest();
