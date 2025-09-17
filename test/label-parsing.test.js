import path from "path";
import chalk from "chalk";
import "dotenv/config";

import { markdownParser } from "../src/utils/markdown-parser.js";
import { extractLabels, validateLabel } from "../src/utils/label-extractor.js";
import {
  createLabel,
  getLabels,
  isLabelNameUnique,
  createLabelWithUniqueName,
} from "../src/apis/label.api.js";

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

  // Test 4: Test with mock data
  console.log(
    chalk.blue("\n🔧 Test 4: Testing label detection with mock data...")
  );
  await testMockLabelExtraction();

  // Test 5: Test Plane API integration (create label)
  const byPassCreateLabel = true;
  if (!byPassCreateLabel) {
    console.log(chalk.blue("\n🚀 Test 6: Testing Plane API label creation..."));
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

  // Test 6: Test Plane API integration (get labels)
  console.log(chalk.blue("\n📋 Test 7: Testing Plane API label retrieval..."));
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

async function testMockLabelExtraction() {
  const mockAST = {
    type: "root",
    children: [
      {
        type: "heading",
        depth: 2,
        children: [
          {
            type: "text",
            value: "Phase 1: [BE-CORE] Backend Development",
          },
        ],
      },
      {
        type: "heading",
        depth: 2,
        children: [
          {
            type: "text",
            value: "Phase 2: [FE-CORE] Frontend Development",
          },
        ],
      },
      {
        type: "list",
        children: [
          {
            type: "listItem",
            children: [
              {
                type: "paragraph",
                children: [
                  {
                    type: "text",
                    value: "[ ] [HIGH] [AUTH] Implement user authentication",
                  },
                ],
              },
            ],
          },
          {
            type: "listItem",
            children: [
              {
                type: "paragraph",
                children: [
                  {
                    type: "text",
                    value:
                      "[x] [MEDIUM] [DB] Setup database schema [DETAILS](./db.md)",
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        type: "paragraph",
        children: [
          {
            type: "text",
            value:
              "This is a [TEST] label in paragraph text with [MULTIPLE] labels.",
          },
        ],
      },
    ],
  };

  try {
    const mockLabels = extractLabels(mockAST);

    console.log(chalk.green("  ✅ Mock label extraction successful"));
    console.log(
      chalk.gray(`  🏷️  Found ${mockLabels.length} label(s) in mock data`)
    );

    // Validate mock results
    const expectedLabels = [
      "BE-CORE",
      "FE-CORE",
      "HIGH",
      "AUTH",
      "MEDIUM",
      "DB",
      "DETAILS", // This comes from the link [DETAILS](./db.md)
      "TEST",
      "MULTIPLE",
    ];

    const extractedLabelNames = mockLabels.map((label) => label.name);

    if (mockLabels.length === expectedLabels.length) {
      console.log(chalk.green("  ✅ Correct number of labels detected"));

      expectedLabels.forEach((expectedLabel, index) => {
        if (extractedLabelNames.includes(expectedLabel)) {
          console.log(
            chalk.green(`    ✅ Label ${index + 1}: "${expectedLabel}"`)
          );
        } else {
          console.log(
            chalk.red(`    ❌ Label ${index + 1}: "${expectedLabel}" not found`)
          );
        }
      });
    } else {
      console.log(
        chalk.red(
          `    ❌ Expected ${expectedLabels.length} labels, got ${mockLabels.length}`
        )
      );
      console.log(chalk.gray("    Expected:", expectedLabels));
      console.log(chalk.gray("    Found:", extractedLabelNames));
    }

    // Test validation
    const allValid = mockLabels.every((label) => validateLabel(label));
    if (allValid) {
      console.log(chalk.green("  ✅ All mock labels passed validation"));
    } else {
      console.log(chalk.red("  ❌ Some mock labels failed validation"));
    }

    // Test duplicate removal
    const uniqueLabelNames = [...new Set(extractedLabelNames)];
    if (uniqueLabelNames.length === extractedLabelNames.length) {
      console.log(chalk.green("  ✅ No duplicate labels found"));
    } else {
      console.log(chalk.yellow("  ⚠️  Duplicate labels detected and removed"));
    }
  } catch (error) {
    console.log(
      chalk.red("  ❌ Mock label extraction test failed:"),
      error.message
    );
  }
}

labelParsingTest();
