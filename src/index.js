import "dotenv/config";
import path from "path";
import { markdownParser } from "./utils/markdown-parser.js";

const checklistFolder = path.resolve(process.cwd(), "checklist-example");
const checklistFile = path.resolve(checklistFolder, "checklist-example.md");

const checklist = await markdownParser(checklistFile);

console.log(checklist);
