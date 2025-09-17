/**
 * Module Extractor - Extracts modules from markdown AST
 * Handles heading detection and module structure creation
 */

/**
 * Walk through AST nodes recursively
 * @param {Object} node - AST node
 * @param {Function} callback - Callback function for each node
 */
function walkAST(node, callback) {
  callback(node);
  if (node.children) {
    node.children.forEach((child) => walkAST(child, callback));
  }
}

/**
 * Extract text content from heading node
 * @param {Object} heading - Heading AST node
 * @returns {string} Heading text content
 */
function extractTextFromHeading(heading) {
  if (!heading.children) {
    return "";
  }

  let text = "";
  heading.children.forEach((child) => {
    if (child.type === "text") {
      text += child.value;
    }
  });

  return text.trim();
}

/**
 * Remove label patterns from module name
 * Labels are in format: [LABEL_NAME]
 * @param {string} moduleName - Module name with potential labels
 * @returns {string} Cleaned module name without labels
 */
function removeLabelsFromModuleName(moduleName) {
  // Remove label patterns like [BE-CORE], [FE-CORE], etc.
  const labelPattern = /\s*\[[A-Z0-9-_]+\]\s*/g;
  return moduleName.replace(labelPattern, " ").trim();
}

/**
 * Extract modules from markdown AST
 * @param {Object} ast - The parsed markdown AST
 * @returns {Array} Array of extracted module objects
 */
export function extractModules(ast) {
  const modules = [];

  walkAST(ast, (node) => {
    // Detect module headers (## headings)
    if (node.type === "heading" && node.depth === 2) {
      const rawModuleName = extractTextFromHeading(node);
      const cleanModuleName = removeLabelsFromModuleName(rawModuleName);

      const modulePayload = {
        id: null,
        created_at: null,
        updated_at: null,
        name: cleanModuleName,
        description: "",
        description_text: null,
        description_html: null,
        start_date: null,
        target_date: null,
        status: "planned",
        view_props: {},
        sort_order: 55535.0,
        created_by: null,
        updated_by: null,
        project: null,
        workspace: null,
        lead: null,
        members: [],
        markdown: {
          rawText: rawModuleName,
          cleanText: cleanModuleName,
          level: node.depth,
        },
      };

      modules.push(modulePayload);
    }
  });

  return modules;
}

/**
 * Validate extracted module
 * @param {Object} module - Module object to validate
 * @returns {boolean} True if module is valid
 */
export function validateModule(module) {
  return (
    module &&
    typeof module.name === "string" &&
    module.name.trim().length > 0 &&
    module.markdown &&
    typeof module.markdown.rawText === "string"
  );
}
