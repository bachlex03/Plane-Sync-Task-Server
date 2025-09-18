import "dotenv/config";
import path from "path";
import { markdownParser } from "./utils/markdown-parser.js";

import { getIssues, deleteAllIssues, deleteIssue } from "./apis/issue.api.js";

// const checklistFolder = path.resolve(process.cwd(), "checklist-example");
// const checklistFile = path.resolve(checklistFolder, "checklist-example.md");

// const checklist = await markdownParser(checklistFile);

// console.log(checklist);

// const issues = await getIssues("50:0:0");
// console.log(issues);

// await deleteIssue("4baa0f78-17b9-470e-ae0d-bed0e5debfa6");

await deleteAllIssues(true);
