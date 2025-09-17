import axios from "axios";
import chalk from "chalk";
import "dotenv/config";

/**
 * Check if a label name is unique in the project
 * @param {string} labelName - Label name to check
 * @returns {boolean} True if unique, false if already exists
 */
export async function isLabelNameUnique(labelName) {
  try {
    const existingLabels = await getLabels();
    if (!existingLabels) {
      return true; // If we can't fetch labels, assume unique
    }

    const isUnique = !existingLabels.some(
      (label) => label.name.toLowerCase() === labelName.toLowerCase()
    );

    console.log(
      chalk.gray(`    Checking label name uniqueness: "${labelName}"`)
    );
    console.log(
      chalk.gray(`    Result: ${isUnique ? "Unique" : "Already exists"}`)
    );

    return isUnique;
  } catch (error) {
    console.log(
      chalk.yellow(
        `    ⚠️  Error checking label name uniqueness: ${error.message}`
      )
    );
    return true; // If error, assume unique to allow creation attempt
  }
}

/**
 * Create a new label in Plane
 * @param {Object} labelData - Label data object
 * @returns {Object} Created label response
 */
export async function createLabel(labelData) {
  if (!labelData) {
    throw new Error("Label data is required");
  }

  // Check if label name is unique before creating
  const isUnique = await isLabelNameUnique(labelData.name);
  if (!isUnique) {
    throw new Error(
      `Label name "${labelData.name}" already exists. Please use a unique name.`
    );
  }

  try {
    console.log(chalk.green(`Label creating in Plane...${labelData.name}`));
    console.log("labelData", labelData);

    const response = await axios.post(
      `${process.env.PLANE_API_BASE_URL}/api/v1/workspaces/${process.env.PLANE_WORKSPACE_SLUG}/projects/${process.env.PLANE_PROJECT_ID}/labels/`,
      {
        id: labelData.id || null,
        created_at: labelData.created_at || null,
        updated_at: labelData.updated_at || null,
        name: labelData.name,
        color: labelData.color || "#3b82f6", // Default blue color
        description: labelData.description || "",
        created_by: labelData.created_by || null,
        updated_by: labelData.updated_by || null,
        project: labelData.project || null,
        workspace: labelData.workspace || null,
      },
      {
        headers: {
          "X-API-Key": process.env.PLANE_API_KEY,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    if (response.status === 201) {
      console.log(chalk.green(`    ✅ Label created: ${response.data}`));
      return response.data;
    } else {
      throw new Error(`Unexpected response status: ${response.status}`);
    }
  } catch (error) {
    console.log(chalk.yellow(`    ⚠️  Error: ${error.message}`));
  }
}

/**
 * Get all labels from Plane
 * @returns {Array} Array of labels
 */
export async function getLabels() {
  try {
    const response = await axios.get(
      `${process.env.PLANE_API_BASE_URL}/api/v1/workspaces/${process.env.PLANE_WORKSPACE_SLUG}/projects/${process.env.PLANE_PROJECT_ID}/labels/`,
      {
        headers: {
          "X-API-Key": process.env.PLANE_API_KEY,
        },
      }
    );

    if (response.status === 200) {
      console.log(chalk.green(`    ✅ Labels fetched: ${response.data}`));
      console.log("response.data", response.data);
      return response.data.results;
    } else {
      throw new Error(`Unexpected response status: ${response.status}`);
    }
  } catch (error) {
    console.log(chalk.yellow(`    ⚠️  Error: ${error.message}`));
  }
}

/**
 * Update a label in Plane
 * @param {string} labelId - Label ID
 * @param {Object} updateData - Data to update
 * @returns {Object} Updated label response
 */
export async function updateLabel(labelId, updateData) {
  try {
    const response = await axios.patch(
      `${process.env.PLANE_API_BASE_URL}/api/v1/workspaces/${process.env.PLANE_WORKSPACE_SLUG}/projects/${process.env.PLANE_PROJECT_ID}/labels/${labelId}/`,
      updateData,
      {
        headers: {
          "X-API-Key": process.env.PLANE_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status === 200) {
      console.log(chalk.green(`    ✅ Label updated: ${response.data}`));
      return response.data;
    } else {
      throw new Error(`Unexpected response status: ${response.status}`);
    }
  } catch (error) {
    console.log(chalk.yellow(`    ⚠️  Error: ${error.message}`));
  }
}

/**
 * Delete a label from Plane
 * @param {string} labelId - Label ID
 * @returns {boolean} Success status
 */
export async function deleteLabel(labelId) {
  try {
    const response = await axios.delete(
      `${process.env.PLANE_API_BASE_URL}/api/v1/workspaces/${process.env.PLANE_WORKSPACE_SLUG}/projects/${process.env.PLANE_PROJECT_ID}/labels/${labelId}/`,
      {
        headers: {
          "X-API-Key": process.env.PLANE_API_KEY,
        },
      }
    );

    if (response.status === 204) {
      console.log(chalk.green(`    ✅ Label deleted`));
      return true;
    } else {
      throw new Error(`Unexpected response status: ${response.status}`);
    }
  } catch (error) {
    console.log(chalk.yellow(`    ⚠️  Error: ${error.message}`));
    return false;
  }
}

/**
 * Find or create labels by names
 * @param {Array} labelNames - Array of label names to find or create
 * @returns {Array} Array of label objects
 */
export async function findOrCreateLabels(labelNames) {
  try {
    const existingLabels = await getLabels();
    const existingLabelNames = existingLabels.map((label) => label.name);
    const labelsToCreate = labelNames.filter(
      (name) => !existingLabelNames.includes(name)
    );

    const createdLabels = [];

    // Create missing labels
    for (const labelName of labelsToCreate) {
      const labelData = {
        name: labelName,
        color: "#3b82f6", // Default blue color
        description: `Auto-generated label for ${labelName}`,
      };
      const createdLabel = await createLabel(labelData);
      if (createdLabel) {
        createdLabels.push(createdLabel);
      }
    }

    // Return all labels (existing + newly created)
    const allLabels = [...existingLabels, ...createdLabels];
    const requestedLabels = allLabels.filter((label) =>
      labelNames.includes(label.name)
    );

    return requestedLabels;
  } catch (error) {
    console.log(
      chalk.yellow(`    ⚠️  Error finding or creating labels: ${error.message}`)
    );
    return [];
  }
}
