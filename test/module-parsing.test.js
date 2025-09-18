import path from "path";
import chalk from "chalk";
import "dotenv/config";

import { markdownParser } from "../src/utils/markdown-parser.js";
import {
  extractModules,
  validateModule,
  exportModulesToJSON,
} from "../src/utils/module-extractor.js";
import { createModule, getModules } from "../src/apis/module.api.js";

const docsPath = path.resolve(process.cwd(), "docs");
const backendPath = path.resolve(docsPath, "backend");
const backendImplementationPhasesPath = path.resolve(
  backendPath,
  "backend-implementation-phases.md"
);

const SORT_ORDER = 100;

async function moduleParsingTest() {
  console.log(chalk.blue.bold("🧪 Testing Module Extraction from Markdown"));
  console.log(chalk.gray("==========================================\n"));

  // Test 1: Basic AST parsing
  let ast = null;

  console.log(chalk.blue("\n📄 Test 1: Basic AST parsing..."));
  try {
    ast = await markdownParser(backendImplementationPhasesPath);
    console.log(chalk.green("✅ AST parsing successful"));
    console.log(chalk.gray("AST type:", ast.type));
    console.log(chalk.gray("Children count:", ast.children?.length || 0));
  } catch (error) {
    console.log(chalk.red("❌ AST parsing failed:"), error.message);
    return;
  }

  // Test 2: Module extraction
  console.log(chalk.blue("\n📦 Test 2: Module extraction..."));
  try {
    const result = extractModules(ast, SORT_ORDER);
    const modules = result.modules;
    console.log(chalk.green("✅ Module extraction successful"));
    console.log(chalk.gray("Extracted modules count:", modules.length));

    if (modules.length > 0) {
      console.log(chalk.yellow("\n📦 Extracted modules:"));
      modules.forEach((module, index) => {
        console.log(chalk.cyan(`  Module ${index + 1}:`));
        console.log(chalk.white(`    Name: "${module.payload.name}"`));
        console.log(
          chalk.white(`    Description: "${module.payload.description}"`)
        );
        console.log(chalk.white(`    Status: ${module.payload.status}`));
        console.log(chalk.white(`    Label: "${module.label.name}"`));
        console.log(
          chalk.white(`    Sort Order: ${module.payload.sort_order}`)
        );
        console.log(chalk.gray(`    Raw Text: "${module.raw_text}"`));
        console.log(chalk.gray(`    Clean Text: "${module.clean_text}"`));
        console.log();
      });
    }
  } catch (error) {
    console.log(chalk.red("❌ Module extraction failed:"), error.message);
    return;
  }

  // Test 3: Module validation
  console.log(chalk.blue("\n✅ Test 3: Module validation..."));
  try {
    const result = extractModules(ast, SORT_ORDER);
    const modules = result.modules;
    console.log(chalk.green("✅ Module validation test"));

    modules.forEach((module, index) => {
      const isValid = validateModule(module);
      const status = isValid
        ? chalk.green("✅ Valid")
        : chalk.red("❌ Invalid");
      console.log(chalk.gray(`  Module ${index + 1}: ${status}`));

      if (!isValid) {
        console.log(chalk.red("    Validation failed for module:"), module);
      }
    });
  } catch (error) {
    console.log(chalk.red("❌ Module validation failed:"), error.message);
    return;
  }

  // Test 4: Test with mock data
  console.log(
    chalk.blue("\n🔧 Test 4: Testing module detection with mock data...")
  );
  await testMockModuleExtraction();

  // Test 5: Test Plane API integration (create module)
  const byPassCreateModule = false;
  if (!byPassCreateModule) {
    console.log(
      chalk.blue("\n🚀 Test 5: Testing Plane API module creation...")
    );
    try {
      const result = extractModules(ast, SORT_ORDER);
      const modules = result.modules;
      if (modules.length > 0) {
        const createdModule = await createModule(modules[0]);
        if (createdModule) {
          console.log(chalk.green("✅ Plane API module creation successful"));
          console.log(chalk.gray("Created module:", createdModule.name));
          console.log(chalk.gray("Module ID:", createdModule.id));
        }
      } else {
        console.log(chalk.yellow("⚠️  No modules to create"));
      }
    } catch (error) {
      console.log(
        chalk.red("❌ Plane API module creation failed:"),
        error.message
      );
    }
  }

  // Test 6: Test Plane API integration (get modules)
  console.log(chalk.blue("\n📋 Test 6: Testing Plane API module retrieval..."));
  try {
    const existingModules = await getModules();
    if (existingModules && existingModules.length > 0) {
      console.log(chalk.green("✅ Plane API module retrieval successful"));
      console.log(
        chalk.gray(`Found ${existingModules.length} existing module(s)`)
      );

      console.log(chalk.yellow("\n📦 Existing modules in Plane:"));
      existingModules.forEach((module, index) => {
        console.log(chalk.cyan(`  Module ${index + 1}:`));
        console.log(chalk.white(`    Name: "${module.name}"`));
        console.log(chalk.white(`    ID: ${module.id}`));
        console.log(chalk.white(`    Status: ${module.status || "N/A"}`));
        console.log(chalk.white(`    Created: ${module.created_at || "N/A"}`));
        console.log();
      });
    } else {
      console.log(chalk.yellow("⚠️  No existing modules found in Plane"));
    }
  } catch (error) {
    console.log(
      chalk.red("❌ Plane API module retrieval failed:"),
      error.message
    );
  }

  // Test 7: Test JSON export
  console.log(chalk.blue("\n💾 Test 7: Testing JSON export..."));
  try {
    const result = extractModules(ast, SORT_ORDER);
    const outputPath = path.resolve(process.cwd(), "output", "modules.json");
    await exportModulesToJSON(result, outputPath);
    console.log(chalk.green("✅ JSON export successful"));
  } catch (error) {
    console.log(chalk.red("❌ JSON export failed:"), error.message);
  }

  console.log(chalk.green.bold("\n🎉 All module tests completed!"));
}

async function testMockModuleExtraction() {
  const mockAST = {
    type: "root",
    children: [
      {
        type: "heading",
        depth: 2,
        children: [
          {
            type: "text",
            value: "Phase 1: Backend Development",
          },
        ],
      },
      {
        type: "heading",
        depth: 2,
        children: [
          {
            type: "text",
            value: "Phase 2: Frontend Development",
          },
        ],
      },
      {
        type: "heading",
        depth: 1, // This should be ignored (not level 2)
        children: [
          {
            type: "text",
            value: "Main Title",
          },
        ],
      },
      {
        type: "heading",
        depth: 2,
        children: [
          {
            type: "text",
            value: "Phase 3: Testing & Deployment",
          },
        ],
      },
    ],
  };

  try {
    const mockResult = extractModules(mockAST, SORT_ORDER);
    const mockModules = mockResult.modules;

    console.log(chalk.green("  ✅ Mock module extraction successful"));
    console.log(
      chalk.gray(`  📦 Found ${mockModules.length} module(s) in mock data`)
    );

    // Validate mock results
    const expectedModules = [
      "Phase 1: Backend Development",
      "Phase 2: Frontend Development",
      "Phase 3: Testing & Deployment",
    ];

    if (mockModules.length === expectedModules.length) {
      console.log(chalk.green("  ✅ Correct number of modules detected"));

      mockModules.forEach((module, index) => {
        const expected = expectedModules[index];
        if (module.payload.name === expected) {
          console.log(
            chalk.green(`    ✅ Module ${index + 1}: "${module.payload.name}"`)
          );
        } else {
          console.log(
            chalk.red(
              `    ❌ Module ${index + 1}: Expected "${expected}", got "${
                module.payload.name
              }"`
            )
          );
        }
      });
    } else {
      console.log(
        chalk.red(
          `    ❌ Expected ${expectedModules.length} modules, got ${mockModules.length}`
        )
      );
    }

    // Test validation
    const allValid = mockModules.every((module) => validateModule(module));
    if (allValid) {
      console.log(chalk.green("  ✅ All mock modules passed validation"));
    } else {
      console.log(chalk.red("  ❌ Some mock modules failed validation"));
    }
  } catch (error) {
    console.log(
      chalk.red("  ❌ Mock module extraction test failed:"),
      error.message
    );
  }
}

moduleParsingTest();
