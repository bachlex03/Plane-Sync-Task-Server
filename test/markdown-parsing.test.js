import path from "path";
import chalk from "chalk";
import "dotenv/config";

import {
  createChecklistJSON,
  saveChecklistJSON,
  loadChecklistFromMarkdown,
} from "../src/utils/checklist-manager.js";

const docsPath = path.resolve(process.cwd(), "docs");
const backendPath = path.resolve(docsPath, "backend");
const backendImplementationPhasesPath = path.resolve(
  backendPath,
  "backend-implementation-phases.md"
);

// Get module filter from command line arguments
const moduleFilter = process.argv[2] || null;

async function testChecklistManager() {
  console.log(chalk.blue.bold("🧪 Testing Checklist Manager"));
  console.log(chalk.gray("================================\n"));

  if (moduleFilter) {
    console.log(chalk.yellow(`🔍 Filtering for module: "${moduleFilter}"`));
    console.log(
      chalk.gray("Usage: node test/markdown-parsing.test.js [module-filter]")
    );
    console.log(chalk.gray("Examples:"));
    console.log(chalk.gray('  node test/markdown-parsing.test.js "Phase 1"'));
    console.log(chalk.gray('  node test/markdown-parsing.test.js "BE-CORE"'));
    console.log(chalk.gray('  node test/markdown-parsing.test.js "CQRS"'));
    console.log();
  }

  try {
    // Test 1: Create checklist JSON from markdown
    console.log(
      chalk.blue("📄 Test 1: Creating checklist JSON from markdown...")
    );
    const checklistJSON = await createChecklistJSON(
      backendImplementationPhasesPath,
      moduleFilter
    );

    console.log(chalk.green("✅ Checklist JSON created successfully"));
    console.log(chalk.gray(`Found ${checklistJSON.modules.length} module(s)`));

    // Display summary
    checklistJSON.modules.forEach((module, index) => {
      console.log(chalk.cyan(`\n📦 Module ${index + 1}:`));
      console.log(chalk.white(`  Name: "${module.clean_text}"`));
      console.log(chalk.white(`  Type: ${module.type}`));
      console.log(chalk.white(`  Level: ${module.level}`));
      console.log(chalk.white(`  Issues: ${module.issues.length}`));
      console.log(chalk.white(`  Sub-modules: ${module.sub_modules.length}`));

      if (module.label) {
        console.log(chalk.white(`  Label: ${module.label.name}`));
      }

      // Show first few issues
      if (module.issues.length > 0) {
        console.log(chalk.yellow(`  Sample Issues:`));
        module.issues.slice(0, 3).forEach((issue, issueIndex) => {
          console.log(chalk.gray(`    ${issueIndex + 1}. ${issue.name}`));
        });
        if (module.issues.length > 3) {
          console.log(
            chalk.gray(`    ... and ${module.issues.length - 3} more`)
          );
        }
      }
    });

    // Test 2: Save to file
    console.log(chalk.blue("\n💾 Test 2: Saving checklist JSON to file..."));
    const outputPath = path.resolve(
      process.cwd(),
      moduleFilter
        ? `checklist-${moduleFilter
            .replace(/\s+/g, "-")
            .toLowerCase()}-output.json`
        : "checklist-output.json"
    );
    await saveChecklistJSON(checklistJSON, outputPath);
    console.log(chalk.green("✅ Checklist JSON saved successfully"));

    // Test 3: Load from markdown with auto-save
    console.log(chalk.blue("\n🔄 Test 3: Loading checklist with auto-save..."));
    const autoSavePath = path.resolve(
      process.cwd(),
      moduleFilter
        ? `checklist-${moduleFilter.replace(/\s+/g, "-").toLowerCase()}.json`
        : "checklist-auto-save.json"
    );
    const loadedChecklist = await loadChecklistFromMarkdown(
      backendImplementationPhasesPath,
      autoSavePath,
      moduleFilter
    );
    console.log(chalk.green("✅ Checklist loaded and auto-saved successfully"));

    // Test 4: Display JSON structure sample
    console.log(chalk.blue("\n📋 Test 4: Displaying JSON structure sample..."));
    if (checklistJSON.modules.length > 0) {
      const sampleModule = checklistJSON.modules[0];
      console.log(chalk.yellow("Sample Module Structure:"));
      console.log(
        chalk.gray(
          JSON.stringify(
            {
              type: sampleModule.type,
              raw_text: sampleModule.raw_text,
              clean_text: sampleModule.clean_text,
              level: sampleModule.level,
              label: sampleModule.label
                ? {
                    name: sampleModule.label.name,
                    raw_text: sampleModule.label.raw_text,
                  }
                : null,
              issues_count: sampleModule.issues.length,
              sub_modules_count: sampleModule.sub_modules.length,
            },
            null,
            2
          )
        )
      );
    }

    console.log(
      chalk.green.bold(
        "\n🎉 All checklist manager tests completed successfully!"
      )
    );
  } catch (error) {
    console.log(chalk.red("❌ Checklist manager test failed:"), error.message);
    console.error(error);
  }
}

// Run the test
testChecklistManager();
