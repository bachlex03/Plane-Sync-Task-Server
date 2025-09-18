/**
 * Label Extractor - Extracts labels from markdown AST
 * Handles label detection in headings and other text content
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
        color: null, // Default color, can be customized later
        description: "",
        created_at: null,
        updated_at: null,
        created_by: null,
        project: null,
        workspace: null,
        markdown: {
          raw_text: match[0], // The full [LABEL_NAME] text
        },
      });
    }
  }

  return labels;
}

/**
 * Extract labels from markdown AST
 * @param {Object} ast - The parsed markdown AST
 * @returns {Array} Array of extracted label objects
 */
export function extractLabels(ast) {
  const labels = [];

  walkAST(ast, (node) => {
    // Extract labels from headings (## headings)
    if (node.type === "heading" && node.depth === 2) {
      const headingText = extractTextFromHeading(node);
      const headingLabels = extractLabelsFromText(headingText);
      labels.push(...headingLabels);
    }
    // Extract labels from list items (issues)
    else if (node.type === "listItem") {
      const listItemText = extractTextFromListItem(node);
      if (listItemText) {
        const itemLabels = extractLabelsFromText(listItemText);
        labels.push(...itemLabels);
      }
    }
    // Extract labels from paragraph text
    else if (node.type === "paragraph") {
      const paragraphText = extractTextFromParagraph(node);
      if (paragraphText) {
        const paragraphLabels = extractLabelsFromText(paragraphText);
        labels.push(...paragraphLabels);
      }
    }
  });

  // Remove duplicate labels based on name
  const uniqueLabels = labels.filter(
    (label, index, self) =>
      index === self.findIndex((l) => l.name === label.name)
  );

  return uniqueLabels;
}

/**
 * Extract text content from list item node
 * @param {Object} listItem - List item AST node
 * @returns {string} List item text content
 */
function extractTextFromListItem(listItem) {
  if (!listItem.children) {
    return "";
  }

  let text = "";
  listItem.children.forEach((child) => {
    if (child.type === "paragraph") {
      text += extractTextFromParagraph(child);
    }
  });

  return text.trim();
}

/**
 * Extract text content from paragraph node
 * @param {Object} paragraph - Paragraph AST node
 * @returns {string} Paragraph text content
 */
function extractTextFromParagraph(paragraph) {
  if (!paragraph.children) {
    return "";
  }

  let text = "";
  paragraph.children.forEach((child) => {
    if (child.type === "text") {
      text += child.value;
    } else if (child.type === "link") {
      const linkText = child.children
        ? child.children.map((c) => c.value).join("")
        : "";
      const url = child.url || "";
      text += `[${linkText}](${url})`;
    }
  });

  return text.trim();
}

/**
 * Validate extracted label
 * @param {Object} label - Label object to validate
 * @returns {boolean} True if label is valid
 */
export function validateLabel(label) {
  return (
    label &&
    typeof label.name === "string" &&
    label.name.trim().length > 0 &&
    label.markdown &&
    typeof label.markdown.raw_text === "string" &&
    label.markdown.raw_text.startsWith("[") &&
    label.markdown.raw_text.endsWith("]")
  );
}
