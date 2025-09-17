import fs from "fs";

import remarkParse from "remark-parse";
import { unified } from "unified";
import { extractIssues, validateIssue } from "./issue-extractor.js";

export async function markdownParser(markdownPath) {
  try {
    const fileExists = fs.existsSync(markdownPath);

    if (!fileExists) {
      throw new Error(`File ${markdownPath} not found`);
    }

    const content = fs.readFileSync(markdownPath, "utf8");

    const processor = await unified().use(remarkParse, { gfm: true });

    // Parse markdown to AST
    const ast = processor.parse(content);

    return ast;
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(`File not found: ${markdownPath}`);
    } else if (error.code === "EACCES") {
      throw new Error(`Permission denied: ${markdownPath}`);
    } else if (error.code === "EISDIR") {
      throw new Error(`Path is a directory, not a file: ${markdownPath}`);
    }

    throw new Error(`Error reading file ${markdownPath}: ${error.message}`);
  }
}

/**
 * Parse markdown file and extract issues
 * @param {string} markdownPath - Path to markdown file
 * @returns {Array} Array of extracted and validated issues
 */
export async function parseMarkdownIssues(markdownPath) {
  try {
    const ast = await markdownParser(markdownPath);
    const issues = extractIssues(ast);

    // Validate all issues
    const validIssues = issues.filter((issue) => validateIssue(issue));

    if (validIssues.length !== issues.length) {
      console.warn(
        `Warning: ${
          issues.length - validIssues.length
        } invalid issues were filtered out`
      );
    }

    return validIssues;
  } catch (error) {
    throw new Error(`Error parsing markdown issues: ${error.message}`);
  }
}
