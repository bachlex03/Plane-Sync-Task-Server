// import path from "path";
// import chalk from "chalk";
// import fs from "fs";
// import "dotenv/config";

// import { getIssues, createIssue } from "../src/apis/issue.api.js";

// const outputFolder = path.resolve(process.cwd(), "output");
// const subIssuesJSONPath = path.resolve(
//   outputFolder,
//   "backend-sub-issues-phase1.json"
// );

// const addSubIssuesToParentIssueNames = [
//   "[BE-CORE]: Xây dựng API Gateway / Load Balancer (Tenant routing, context injection)",
// ];

// /**
//  * Load sub issues from JSON file
//  * @returns {Object} Sub issues data from JSON file
//  */
// function loadSubIssuesFromJSON() {
//   try {
//     if (!fs.existsSync(subIssuesJSONPath)) {
//       throw new Error(`JSON file not found: ${subIssuesJSONPath}`);
//     }

//     const jsonContent = fs.readFileSync(subIssuesJSONPath, "utf8");
//     const subIssuesData = JSON.parse(jsonContent);

//     console.log(
//       chalk.green(
//         `✅ Loaded ${subIssuesData.issues.length} sub-issues from JSON`
//       )
//     );
//     return subIssuesData;
//   } catch (error) {
//     console.log(chalk.red(`❌ Error loading JSON file: ${error.message}`));
//     throw error;
//   }
// }

// /**
//  * Compare sub-issues from JSON with existing issues from API
//  * @param {Array} jsonSubIssues - Sub-issues from JSON file
//  * @param {Array} existingIssues - Issues from API
//  * @returns {Array} Sub-issues that need to be created
//  */
// function findSubIssuesToCreate(jsonSubIssues, existingIssues) {
//   const subIssuesToCreate = [];

//   jsonSubIssues.forEach((jsonSubIssue) => {
//     const subIssueName = jsonSubIssue.name;
//     const exists = existingIssues.some(
//       (existingIssue) =>
//         existingIssue.name.toLowerCase() === subIssueName.toLowerCase()
//     );

//     if (!exists) {
//       subIssuesToCreate.push(jsonSubIssue);
//       console.log(chalk.yellow(`  📝 Sub-issue to create: "${subIssueName}"`));
//     } else {
//       console.log(
//         chalk.gray(`  ✅ Sub-issue already exists: "${subIssueName}"`)
//       );
//     }
//   });

//   return subIssuesToCreate;
// }

// /**
//  * Create a single sub-issue (without actually calling the API)
//  * @param {Object} subIssueData - Sub-issue data to create
//  * @param {string} parentIssueId - ID of the parent issue
//  * @returns {Object} Prepared sub-issue creation data
//  */
// function prepareSubIssueCreation(subIssueData, parentIssueId) {
//   const creationData = {
//     name: subIssueData.name,
//     description_html: subIssueData.payload.description_html || "<p></p>",
//     description_stripped: subIssueData.payload.description_stripped || "",
//     priority: subIssueData.payload.priority || "none",
//     start_date: subIssueData.payload.start_date,
//     target_date: subIssueData.payload.target_date,
//     estimate_point: subIssueData.payload.estimate_point,
//     is_draft: subIssueData.payload.is_draft || false,
//     labels: subIssueData.payload.labels || [], // Sub-issues don't include labels
//     parent: parentIssueId, // Add parent issue ID
//     // Note: We don't include id, created_at, updated_at as these are set by the API
//     // We also don't include created_by, updated_by, project, workspace as these are handled by the API
//     // State will be determined by is_completed status
//   };

//   console.log(
//     chalk.cyan(
//       `  🔧 Prepared sub-issue creation data for: "${subIssueData.name}"`
//     )
//   );
//   console.log(chalk.gray(`    Priority: ${creationData.priority}`));
//   console.log(
//     chalk.gray(`    Completed: ${subIssueData.is_completed || false}`)
//   );
//   console.log(chalk.gray(`    Draft: ${creationData.is_draft}`));
//   console.log(
//     chalk.gray(
//       `    Parent Issue: "${subIssueData.parent_issue_name}" (ID: ${parentIssueId})`
//     )
//   );
//   console.log(chalk.gray(`    Module: "${subIssueData.module_name}"`));

//   return creationData;
// }

// /**
//  * Find parent issue by name
//  * @param {Array} issues - Array of issues from API
//  * @param {string} parentIssueName - Parent issue name to find
//  * @returns {Object|null} Found parent issue or null
//  */
// function findParentIssueByName(issues, parentIssueName) {
//   if (!issues || !Array.isArray(issues)) {
//     return null;
//   }

//   const parentIssue = issues.find(
//     (issue) => issue.name.toLowerCase() === parentIssueName.toLowerCase()
//   );

//   return parentIssue || null;
// }

// /**
//  * Add created sub-issues to their parent issues
//  * @param {Array} createdSubIssues - Array of created sub-issue objects
//  * @param {Array} parentIssueNames - Array of parent issue names to add sub-issues to
//  * @returns {boolean} Success status
//  */
// async function addSubIssuesToParentIssues(createdSubIssues, parentIssueNames) {
//   try {
//     console.log(chalk.blue(`\n🔗 Adding sub-issues to parent issues...`));

//     // Get all issues to find parent issues
//     const allIssues = await getIssues();
//     if (!allIssues) {
//       console.log(chalk.red("❌ Failed to fetch issues"));
//       return false;
//     }

//     let totalSuccess = 0;
//     let totalFailed = 0;

//     for (const parentIssueName of parentIssueNames) {
//       console.log(
//         chalk.blue(`\n📋 Processing parent issue: "${parentIssueName}"`)
//       );

//       // Find the parent issue
//       const parentIssue = findParentIssueByName(allIssues, parentIssueName);
//       if (!parentIssue) {
//         console.log(
//           chalk.red(`❌ Parent issue not found: "${parentIssueName}"`)
//         );
//         totalFailed++;
//         continue;
//       }

//       console.log(
//         chalk.green(
//           `✅ Found parent issue: "${parentIssue.name}" (ID: ${parentIssue.id})`
//         )
//       );

//       // Filter sub-issues that belong to this parent
//       const subIssuesForParent = createdSubIssues.filter(
//         (subIssue) => subIssue.parent_issue_name === parentIssueName
//       );

//       if (subIssuesForParent.length === 0) {
//         console.log(
//           chalk.yellow(
//             `⚠️  No sub-issues found for parent: "${parentIssueName}"`
//           )
//         );
//         continue;
//       }

//       console.log(
//         chalk.blue(
//           `📋 Found ${subIssuesForParent.length} sub-issue(s) for this parent`
//         )
//       );

//       // For now, we'll just log what would be done
//       // In a real implementation, you might want to create a parent-child relationship
//       // or add the sub-issues as child issues to the parent
//       subIssuesForParent.forEach((subIssue, index) => {
//         console.log(
//           chalk.gray(
//             `  ${index + 1}. "${subIssue.name}" → Parent: "${parentIssue.name}"`
//           )
//         );
//       });

//       totalSuccess += subIssuesForParent.length;
//     }

//     console.log(chalk.green.bold(`\n📊 Summary:`));
//     console.log(
//       chalk.white(`  Successfully processed: ${totalSuccess} sub-issues`)
//     );
//     console.log(
//       chalk.white(`  Failed to process: ${totalFailed} parent issues`)
//     );

//     return totalSuccess > 0;
//   } catch (error) {
//     console.log(
//       chalk.red(`❌ Error adding sub-issues to parent issues: ${error.message}`)
//     );
//     return false;
//   }
// }

// async function createSubIssueTest() {
//   console.log(chalk.blue.bold("🧪 Testing Sub-Issue Creation Process"));
//   console.log(chalk.gray("==========================================\n"));

//   try {
//     // Step 1: Load sub-issues from JSON file
//     console.log(chalk.blue("📄 Step 1: Loading sub-issues from JSON file..."));
//     const jsonSubIssuesData = loadSubIssuesFromJSON();
//     const allJsonSubIssues = jsonSubIssuesData.issues;

//     // Filter sub-issues to only include those belonging to parent issues in our array
//     const jsonSubIssues = allJsonSubIssues.filter((subIssue) =>
//       addSubIssuesToParentIssueNames.includes(subIssue.parent_issue_name)
//     );

//     console.log(
//       chalk.cyan(
//         `📊 Filtered to ${jsonSubIssues.length} sub-issues for ${addSubIssuesToParentIssueNames.length} parent issue(s)`
//       )
//     );

//     // Step 2: Get all existing issues from API
//     console.log(
//       chalk.blue("\n🌐 Step 2: Fetching existing issues from API...")
//     );
//     const existingIssues = await getIssues();

//     if (!existingIssues) {
//       console.log(chalk.yellow("⚠️  No existing issues found or API error"));
//       console.log(
//         chalk.blue(
//           "📝 All sub-issues from JSON will be considered for creation"
//         )
//       );
//     } else {
//       console.log(
//         chalk.green(
//           `✅ Found ${existingIssues.length} existing issues in Plane`
//         )
//       );
//     }

//     // Step 3: Compare and find sub-issues to create
//     console.log(
//       chalk.blue(
//         "\n🔍 Step 3: Comparing JSON sub-issues with existing issues..."
//       )
//     );
//     const subIssuesToCreate = findSubIssuesToCreate(
//       jsonSubIssues,
//       existingIssues || []
//     );

//     if (subIssuesToCreate.length === 0) {
//       console.log(
//         chalk.green("🎉 All sub-issues from JSON already exist in Plane!")
//       );

//       // Test parent issue assignment with existing sub-issues
//       console.log(
//         chalk.blue(
//           "\n🔗 Testing parent issue assignment with existing sub-issues..."
//         )
//       );

//       // Get all existing issues that match our JSON sub-issues
//       const existingMatchingSubIssues = existingIssues.filter((existingIssue) =>
//         jsonSubIssues.some(
//           (jsonSubIssue) =>
//             jsonSubIssue.name.toLowerCase() === existingIssue.name.toLowerCase()
//         )
//       );

//       if (existingMatchingSubIssues.length > 0) {
//         console.log(
//           chalk.blue(
//             `Found ${existingMatchingSubIssues.length} existing sub-issues to assign to parent issues`
//           )
//         );
//         const parentAssignmentSuccess = await addSubIssuesToParentIssues(
//           existingMatchingSubIssues,
//           addSubIssuesToParentIssueNames
//         );

//         if (parentAssignmentSuccess) {
//           console.log(
//             chalk.green(
//               "✅ All existing sub-issues successfully assigned to parent issues!"
//             )
//           );
//         } else {
//           console.log(
//             chalk.red(
//               "❌ Failed to assign some or all sub-issues to parent issues"
//             )
//           );
//         }
//       } else {
//         console.log(
//           chalk.yellow(
//             "⚠️  No matching existing sub-issues found for parent assignment"
//           )
//         );
//       }

//       return;
//     }

//     // Check if ALL sub-issues need to be created (none exist)
//     if (subIssuesToCreate.length === jsonSubIssues.length) {
//       console.log(
//         chalk.blue(
//           `\n🚀 All ${jsonSubIssues.length} sub-issues from JSON need to be created!`
//         )
//       );
//       console.log(
//         chalk.gray("Proceeding with full sub-issue creation process...")
//       );
//     } else {
//       console.log(
//         chalk.yellow(
//           `\n📋 Partial creation needed: ${subIssuesToCreate.length} out of ${jsonSubIssues.length} sub-issues need to be created`
//         )
//       );
//     }

//     console.log(
//       chalk.yellow(
//         `\n📋 Found ${subIssuesToCreate.length} sub-issues to create:`
//       )
//     );

//     // Step 4: Find parent issue IDs and prepare sub-issue creation data
//     console.log(
//       chalk.blue(
//         "\n🔧 Step 4: Finding parent issues and preparing sub-issue creation data..."
//       )
//     );

//     // Find parent issue IDs
//     const parentIssueIds = {};
//     for (const parentIssueName of addSubIssuesToParentIssueNames) {
//       const parentIssue = findParentIssueByName(
//         existingIssues || [],
//         parentIssueName
//       );
//       if (parentIssue) {
//         parentIssueIds[parentIssueName] = parentIssue.id;
//         console.log(
//           chalk.green(
//             `✅ Found parent issue: "${parentIssueName}" (ID: ${parentIssue.id})`
//           )
//         );
//       } else {
//         console.log(
//           chalk.red(`❌ Parent issue not found: "${parentIssueName}"`)
//         );
//       }
//     }

//     const preparedSubIssues = [];

//     subIssuesToCreate.forEach((subIssueData, index) => {
//       console.log(chalk.cyan(`\n  Sub-issue ${index + 1}:`));

//       // Find the parent issue ID for this sub-issue
//       const parentIssueId = parentIssueIds[subIssueData.parent_issue_name];
//       if (!parentIssueId) {
//         console.log(
//           chalk.red(
//             `❌ No parent issue ID found for: "${subIssueData.parent_issue_name}"`
//           )
//         );
//         return; // Skip this sub-issue
//       }

//       const preparedData = prepareSubIssueCreation(subIssueData, parentIssueId);
//       preparedSubIssues.push({
//         originalData: subIssueData,
//         preparedData: preparedData,
//       });
//     });

//     // Summary
//     console.log(chalk.green.bold("\n📊 Summary:"));
//     console.log(
//       chalk.white(`  Total sub-issues in JSON: ${jsonSubIssues.length}`)
//     );
//     console.log(
//       chalk.white(`  Existing issues in Plane: ${existingIssues?.length || 0}`)
//     );
//     console.log(
//       chalk.white(`  Sub-issues to create: ${subIssuesToCreate.length}`)
//     );
//     console.log(
//       chalk.white(
//         `  Sub-issues already exist: ${
//           jsonSubIssues.length - subIssuesToCreate.length
//         }`
//       )
//     );

//     // Optional: Show what would be created (without actually creating)
//     console.log(chalk.blue.bold("\n🚀 Ready to create sub-issues:"));
//     preparedSubIssues.forEach((subIssue, index) => {
//       console.log(
//         chalk.cyan(`  ${index + 1}. "${subIssue.preparedData.name}"`)
//       );
//       console.log(
//         chalk.gray(`     Priority: ${subIssue.preparedData.priority}`)
//       );
//       console.log(
//         chalk.gray(
//           `     Completed: ${subIssue.preparedData.markdown.isCompleted}`
//         )
//       );
//       console.log(chalk.gray(`     Draft: ${subIssue.preparedData.is_draft}`));
//       console.log(
//         chalk.gray(`     Parent: "${subIssue.originalData.parent_issue_name}"`)
//       );
//     });

//     console.log(
//       chalk.green.bold("\n✅ Sub-issue creation preparation completed!")
//     );
//     console.log(
//       chalk.yellow(
//         "💡 To actually create sub-issues, uncomment the creation code below"
//       )
//     );

//     // Uncomment the following lines to actually create sub-issues:
//     console.log(chalk.blue("\n🚀 Creating sub-issues..."));
//     let successCount = 0;
//     let errorCount = 0;
//     const createdSubIssues = [];

//     for (const subIssue of preparedSubIssues) {
//       try {
//         console.log(chalk.blue(`Creating: "${subIssue.preparedData.name}"...`));
//         const createdSubIssue = await createIssue(subIssue.preparedData);
//         if (createdSubIssue) {
//           console.log(chalk.green(`✅ Created: ${createdSubIssue.name}`));
//           // Add parent issue information to the created sub-issue
//           createdSubIssue.parent_issue_name =
//             subIssue.originalData.parent_issue_name;
//           createdSubIssue.module_name = subIssue.originalData.module_name;
//           createdSubIssues.push(createdSubIssue);
//           successCount++;
//         }
//       } catch (error) {
//         console.log(
//           chalk.red(
//             `❌ Failed to create "${subIssue.preparedData.name}": ${error.message}`
//           )
//         );
//         errorCount++;
//       }
//     }

//     console.log(chalk.green.bold("\n📊 Creation Summary:"));
//     console.log(chalk.white(`  Successfully created: ${successCount}`));
//     console.log(chalk.white(`  Failed to create: ${errorCount}`));
//     console.log(chalk.white(`  Total processed: ${preparedSubIssues.length}`));

//     // Step 5: Add created sub-issues to their parent issues
//     if (createdSubIssues.length > 0) {
//       console.log(
//         chalk.blue("\n🔗 Step 5: Adding sub-issues to parent issues...")
//       );
//       const parentAssignmentSuccess = await addSubIssuesToParentIssues(
//         createdSubIssues,
//         addSubIssuesToParentIssueNames
//       );

//       if (parentAssignmentSuccess) {
//         console.log(
//           chalk.green(
//             "✅ All sub-issues successfully assigned to parent issues!"
//           )
//         );
//       } else {
//         console.log(
//           chalk.red(
//             "❌ Failed to assign some or all sub-issues to parent issues"
//           )
//         );
//       }
//     } else {
//       console.log(
//         chalk.yellow(
//           "⚠️  No sub-issues were created, skipping parent assignment"
//         )
//       );
//     }
//   } catch (error) {
//     console.log(chalk.red(`❌ Test failed: ${error.message}`));
//   }
// }

// createSubIssueTest();
