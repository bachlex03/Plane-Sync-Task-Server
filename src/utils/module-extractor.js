/**
 * Module Extractor - Extracts modules from markdown AST
 * Handles heading detection and module structure creation with labels
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
 * Extract labels from text using regex pattern
 * Labels are in format: [LABEL_NAME]
 * @param {string} text - Text to extract labels from
 * @returns {Array} Array of extracted labels
 */
function extractLabelsFromText(text) {
  const labelPattern = /\[([A-Z0-9-_]+)\]/g;
  const labels = [];
  let match;

  while ((match = labelPattern.exec(text)) !== null) {
    const labelName = match[1];
    if (labelName && labelName.trim().length > 0) {
      labels.push({
        name: labelName,
        raw_text: match[0], // The full [LABEL_NAME] text
      });
    }
  }

  return labels;
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
 * @returns {Object} JSON object with modules array following the defined structure
 */
export function extractModules(ast, sortOrderBase = 100) {
  const modules = [];

  walkAST(ast, (node) => {
    // Detect module headers (## headings for main modules, ### for sub-modules)
    if (node.type === "heading" && (node.depth === 2 || node.depth === 3)) {
      const rawModuleName = extractTextFromHeading(node);
      const cleanModuleName = removeLabelsFromModuleName(rawModuleName);

      // Extract labels from the raw text
      const extractedLabels = extractLabelsFromText(rawModuleName);

      // Get the first label (primary label) or create a default one
      const primaryLabel =
        extractedLabels.length > 0
          ? extractedLabels[0]
          : {
              name: "DEFAULT",
              raw_text: "[DEFAULT]",
            };

      // Create label object following the defined structure
      const labelObject = {
        type: "label",
        name: primaryLabel.name,
        raw_text: primaryLabel.raw_text,
        payload: {
          id: null,
          created_at: null,
          updated_at: null,
          name: primaryLabel.name,
          color: "#3b82f6", // Default blue color
          description: "",
          created_by: null,
          updated_by: null,
          project: null,
          workspace: null,
        },
      };

      // Create module object following the defined JSON structure
      const moduleObject = {
        raw_text: rawModuleName,
        clean_text: cleanModuleName,
        label: labelObject,
        payload: {
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
          sort_order: sortOrderBase + modules.length, // Use base + current index
          created_by: null,
          updated_by: null,
          project: null,
          workspace: null,
          lead: null,
          members: [],
        },
      };

      modules.push(moduleObject);
    }
  });

  // Return the complete JSON structure as defined in the rules
  return {
    modules: modules,
  };
}

/**
 * Validate extracted module
 * @param {Object} module - Module object to validate
 * @returns {boolean} True if module is valid
 */
export function validateModule(module) {
  return (
    module &&
    typeof module.raw_text === "string" &&
    module.raw_text.trim().length > 0 &&
    typeof module.clean_text === "string" &&
    module.clean_text.trim().length > 0 &&
    module.label &&
    module.label.name &&
    module.payload &&
    typeof module.payload.name === "string" &&
    module.payload.name.trim().length > 0
  );
}

/**
 * Export modules to JSON file
 * @param {Object} modulesData - The modules data object
 * @param {string} outputPath - Path to save the JSON file
 * @returns {Promise<void>}
 */
export async function exportModulesToJSON(modulesData, outputPath) {
  const fs = await import("fs");
  const path = await import("path");

  try {
    // Ensure the directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write the JSON file with proper formatting
    const jsonString = JSON.stringify(modulesData, null, 2);
    fs.writeFileSync(outputPath, jsonString, "utf8");

    console.log(`✅ Modules exported to: ${outputPath}`);
    console.log(`📦 Total modules: ${modulesData.modules.length}`);
  } catch (error) {
    throw new Error(`Failed to export modules to JSON: ${error.message}`);
  }
}
