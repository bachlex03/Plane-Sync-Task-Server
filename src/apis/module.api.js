import axios from "axios";
import chalk from "chalk";
import "dotenv/config";

/**
 * Check if a module name is unique in the project
 * @param {string} moduleName - Module name to check
 * @returns {boolean} True if unique, false if already exists
 */
export async function isModuleNameUnique(moduleName) {
  try {
    const existingModules = await getModules();
    if (!existingModules) {
      return true; // If we can't fetch modules, assume unique
    }

    const isUnique = !existingModules.some(
      (module) => module.name.toLowerCase() === moduleName.toLowerCase()
    );

    console.log(
      chalk.gray(`    Checking module name uniqueness: "${moduleName}"`)
    );
    console.log(
      chalk.gray(`    Result: ${isUnique ? "Unique" : "Already exists"}`)
    );

    return isUnique;
  } catch (error) {
    console.log(
      chalk.yellow(
        `    ⚠️  Error checking module name uniqueness: ${error.message}`
      )
    );
    return true; // If error, assume unique to allow creation attempt
  }
}

/**
 * Create a new module in Plane
 * @param {Object} modulePayload - Module data object (optional)
 * @returns {Object} Created module response
 */
export async function createModule(modulePayload) {
  if (!modulePayload) {
    throw new Error("Module payload is required");
  }

  // Check if module name is unique before creating
  const isUnique = await isModuleNameUnique(modulePayload.name);
  if (!isUnique) {
    throw new Error(
      `Module name "${modulePayload.name}" already exists. Please use a unique name.`
    );
  }

  try {
    const response = await axios.post(
      `${process.env.PLANE_API_BASE_URL}/api/v1/workspaces/${process.env.PLANE_WORKSPACE_SLUG}/projects/${process.env.PLANE_PROJECT_ID}/modules/`,
      {
        id: modulePayload.id,
        created_at: modulePayload.created_at,
        updated_at: modulePayload.updated_at,
        name: modulePayload.name,
        description: "",
        description_text: modulePayload.description_text,
        description_html: modulePayload.description_html,
        start_date: modulePayload.start_date,
        target_date: modulePayload.target_date,
        status: "planned",
        view_props: {},
        sort_order: 55535.0,
        created_by: null,
        updated_by: null,
        project: null,
        workspace: null,
        lead: null,
        members: [],
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
      console.log(chalk.green(`    ✅ Module created: ${response.data}`));
      console.log("response.data", response.data);
      return response.data;
    } else {
      throw new Error(`Unexpected response status: ${response.status}`);
    }
  } catch (error) {
    console.log(chalk.yellow(`    ⚠️  Error: ${error.message}`));
    if (error.response) {
      console.log(chalk.red(`    Response status: ${error.response.status}`));
      console.log(chalk.red(`    Response data:`, error.response.data));
    }
  }
}

/**
 * Get all modules from Plane
 * @returns {Array} Array of modules
 */
export async function getModules() {
  try {
    const response = await axios.get(
      `${process.env.PLANE_API_BASE_URL}/api/v1/workspaces/${process.env.PLANE_WORKSPACE_SLUG}/projects/${process.env.PLANE_PROJECT_ID}/modules/`,
      {
        headers: {
          "X-API-Key": process.env.PLANE_API_KEY,
        },
      }
    );

    if (response.status === 200) {
      console.log(chalk.green(`    ✅ Modules fetched: ${response.data}`));
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
 * Update a module in Plane
 * @param {string} moduleId - Module ID
 * @param {Object} updateData - Data to update
 * @returns {Object} Updated module response
 */
export async function updateModule(moduleId, updateData) {
  try {
    const response = await axios.patch(
      `${process.env.PLANE_API_BASE_URL}/api/v1/workspaces/${process.env.PLANE_WORKSPACE_SLUG}/projects/${process.env.PLANE_PROJECT_ID}/modules/${moduleId}/`,
      updateData,
      {
        headers: {
          "X-API-Key": process.env.PLANE_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status === 200) {
      console.log(chalk.green(`    ✅ Module updated: ${response.data}`));
      return response.data;
    } else {
      throw new Error(`Unexpected response status: ${response.status}`);
    }
  } catch (error) {
    console.log(chalk.yellow(`    ⚠️  Error: ${error.message}`));
  }
}

/**
 * Delete a module from Plane
 * @param {string} moduleId - Module ID
 * @returns {boolean} Success status
 */
export async function deleteModule(moduleId) {
  try {
    const response = await axios.delete(
      `${process.env.PLANE_API_BASE_URL}/api/v1/workspaces/${process.env.PLANE_WORKSPACE_SLUG}/projects/${process.env.PLANE_PROJECT_ID}/modules/${moduleId}/`,
      {
        headers: {
          "X-API-Key": process.env.PLANE_API_KEY,
        },
      }
    );

    if (response.status === 204) {
      console.log(chalk.green(`    ✅ Module deleted`));
      return true;
    } else {
      throw new Error(`Unexpected response status: ${response.status}`);
    }
  } catch (error) {
    console.log(chalk.yellow(`    ⚠️  Error: ${error.message}`));
    return false;
  }
}
