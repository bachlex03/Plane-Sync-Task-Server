import path from "path";
import chalk from "chalk";
import "dotenv/config";

import {
  markdownParser,
  parseMarkdownIssues,
} from "../src/utils/markdown-parser.js";
import { extractIssues, validateIssue } from "../src/utils/issue-extractor.js";
import { createIssue, getIssues, renameIssue } from "../src/apis/issue.api.js";

const checklistFolder = path.resolve(process.cwd(), "checklist-example");
const markdownFile = path.resolve(checklistFolder, "checklist-example.md");

async function issueParsingTest() {
  console.log(chalk.blue.bold("🧪 Test Markdown Parsing with Remark"));
  console.log(chalk.gray("==========================================\n"));

  // Test 1: Basic AST parsing
  let ast = null;

  console.log(chalk.blue("\n📄 Test 1: Test Basic AST parsing..."));
  try {
    ast = await markdownParser(markdownFile);
    console.log(chalk.green("✅ AST parsing successful"));
    console.log(chalk.gray("AST type:", ast.type));
    console.log(chalk.gray("Children count:", ast.children?.length || 0));
  } catch (error) {
    console.log(chalk.red("❌ AST parsing failed:"), error.message);

    return;
  }

  // Test 2: Issue extraction
  console.log(chalk.blue("\n📋 Test 2: Test Issue extraction..."));
  try {
    const issues = extractIssues(ast);
    console.log(chalk.green("✅ Issue extraction successful"));
    console.log(chalk.gray("Extracted issues count:", issues.length));

    if (issues.length > 0) {
      console.log(chalk.yellow("\n📝 Extracted issues:"));
      issues.forEach((issue, index) => {
        console.log(chalk.cyan(`  Issue ${index + 1}:`));
        console.log(chalk.gray(`    Name: "${issue.name}"`));
        console.log(chalk.gray(`    Priority: ${issue.priority}`));
        console.log(chalk.gray(`    Completed: ${issue.markdown.isCompleted}`));
        console.log(chalk.gray(`    State: ${issue.state}`));
        console.log(chalk.gray(`    Raw text: "${issue.markdown.rawText}"`));
        console.log();
      });
    }
  } catch (error) {
    console.log(chalk.red("❌ Issue extraction failed:"), error.message);

    return;
  }

  // Test 3: Issue validation
  let issues = null;
  console.log(chalk.blue("\n✅ Test 3: Test Issue validation..."));
  try {
    const issues = extractIssues(ast);

    console.log(chalk.green("✅ Issue validation test"));
    issues.forEach((issue, index) => {
      const isValid = validateIssue(issue);
      const status = isValid
        ? chalk.green("✅ Valid")
        : chalk.red("❌ Invalid");
      console.log(chalk.gray(`  Issue ${index + 1}: ${status}`));

      if (!isValid) {
        console.log(chalk.red("    Validation failed for issue:"), issue);

        throw new Error("Validation failed for issue");
      }
    });
  } catch (error) {
    console.log(chalk.red("❌ Issue validation failed:"), error.message);

    return;
  }

  // Test 4: Complete markdown issue parsing
  console.log(
    chalk.blue("\n🚀 Test 4: Test Complete markdown issue parsing...")
  );
  try {
    issues = await parseMarkdownIssues(markdownFile);
    console.log(chalk.green("✅ Complete parsing successful"));
    console.log(chalk.gray("Valid issues count:", issues.length));

    if (issues.length > 0) {
      console.log(chalk.yellow("\n🎯 Final parsed issues:"));
      issues.forEach((issue, index) => {
        console.log(chalk.cyan(`  Issue ${index + 1}:`));
        console.log(chalk.white(`    Name: "${issue.name}"`));
        console.log(chalk.white(`    Priority: ${issue.priority}`));
        console.log(
          chalk.white(`    Completed: ${issue.markdown.isCompleted}`)
        );
        console.log(chalk.white(`    State: ${issue.state}`));
        console.log(
          chalk.white(`    Description HTML: "${issue.description_html}"`)
        );
        console.log(
          chalk.white(
            `    Description Stripped: "${issue.description_stripped}"`
          )
        );
        console.log();
      });
    }
  } catch (error) {
    console.log(chalk.red("❌ Complete parsing failed:"), error.message);

    return;
  }

  // Test 5: Test with different issue formats
  console.log(chalk.blue("\n🔧 Test 5: Test with different issue formats..."));
  await testDifferentIssueFormats();

  // Test 6: Test Plane API integration (POST Create Issue)
  const byPassCreateIssue = false;
  if (!byPassCreateIssue) {
    console.log(
      chalk.blue(
        "\n🚀 Test 6: Test Plane API integration (POST Create Issue)..."
      )
    );
    try {
      await createIssue(issues[0]);
      console.log(chalk.green("✅ Plane API integration successful"));
    } catch (error) {
      console.log(chalk.red("❌ Plane API integration failed:"), error.message);
      return;
    }
  } else {
    console.log(chalk.green("✅ Plane API integration skipped"));
  }

  // Test 7: Test Plane API integration (GET Issues)
  let issuesList = null;
  console.log(
    chalk.blue("\n🚀 Test 7: Test Plane API integration (GET Issues)...")
  );
  try {
    issuesList = await getIssues();
    console.log(chalk.green("✅ Plane API integration successful"));
  } catch (error) {
    console.log(chalk.red("❌ Plane API integration failed:"), error.message);
    return;
  }

  // Test 8: Test Plane API integration (PATCH Rename Issue)
  const byPassRenameIssue = true;
  if (!byPassRenameIssue) {
    console.log(
      chalk.blue(
        "\n🚀 Test 8: Test Plane API integration (PATCH Rename Issue)..."
      )
    );
    try {
      await renameIssue(issuesList[0]);
      console.log(chalk.green("✅ Plane API integration successful"));
    } catch (error) {
      console.log(chalk.red("❌ Plane API integration failed:"), error.message);
      return;
    }
  } else {
    console.log(chalk.green("✅ Plane API integration skipped"));
  }

  console.log(chalk.green.bold("\n🎉 All tests completed!"));
}

async function testDifferentIssueFormats() {
  const testCases = [
    {
      name: "Basic unchecked issue",
      markdown: "- [ ] Simple issue",
      expected: {
        name: "Simple issue",
        priority: "none",
        isCompleted: false,
      },
    },
    {
      name: "Basic checked issue",
      markdown: "- [x] Completed issue",
      expected: {
        name: "Completed issue",
        priority: "none",
        isCompleted: true,
      },
    },
    {
      name: "High priority issue",
      markdown: "- [ ] [high] High priority issue",
      expected: {
        name: "High priority issue",
        priority: "high",
        isCompleted: false,
      },
    },
    {
      name: "Medium priority checked issue",
      markdown: "- [x] [medium] Medium priority completed issue",
      expected: {
        name: "Medium priority completed issue",
        priority: "medium",
        isCompleted: true,
      },
    },
    {
      name: "Issue with link",
      markdown: "- [ ] [urgent] Issue with link [Details](./details.md)",
      expected: {
        name: "Issue with link",
        priority: "urgent",
        isCompleted: false,
      },
    },
  ];

  for (const testCase of testCases) {
    try {
      console.log(chalk.gray(`\n  Testing: ${testCase.name}`));

      // Create a simple AST structure for testing
      const mockAST = {
        type: "root",
        children: [
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
                        value: testCase.markdown.replace("- ", ""),
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const issues = extractIssues(mockAST);

      if (issues.length === 1) {
        const issue = issues[0];
        const nameMatch = issue.name === testCase.expected.name;
        const priorityMatch = issue.priority === testCase.expected.priority;
        const completedMatch =
          issue.markdown.isCompleted === testCase.expected.isCompleted;

        if (nameMatch && priorityMatch && completedMatch) {
          console.log(chalk.green(`    ✅ ${testCase.name} - PASSED`));
        } else {
          console.log(chalk.red(`    ❌ ${testCase.name} - FAILED`));
          console.log(
            chalk.red(`      Expected: ${JSON.stringify(testCase.expected)}`)
          );
          console.log(
            chalk.red(
              `      Got: ${JSON.stringify({
                name: issue.name,
                priority: issue.priority,
                isCompleted: issue.markdown.isCompleted,
              })}`
            )
          );
        }
      } else {
        console.log(
          chalk.red(
            `    ❌ ${testCase.name} - FAILED (expected 1 issue, got ${issues.length})`
          )
        );
      }
    } catch (error) {
      console.log(
        chalk.red(`    ❌ ${testCase.name} - ERROR: ${error.message}`)
      );
    }
  }
}

issueParsingTest();
