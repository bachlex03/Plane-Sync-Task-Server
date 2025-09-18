import axios from "axios";
import chalk from "chalk";
import "dotenv/config";

const stateOfIssues = {
  backlog: "b2339689-0156-490f-b557-0b0b9353916b",
  todo: "56527be1-33ab-4e83-b280-97a32b1ba625",
  in_progress: "3179ca5c-7d72-439a-a548-22dc41f303fd",
  done: "b3bcaf66-e3a9-464e-a9fc-3a8d5da5f4bf",
  cancelled: "3179ca5c-7d72-439a-a548-22dc41f303fd",
};

/**
 * Create a new issue in Plane
 * @param {Object} issueData - Issue data object
 * @returns {Object} Created issue response
 */
export async function createIssue(issueData) {
  try {
    console.log(chalk.green(`Issue creating in Plane...${issueData.name}`));
    console.log("issueData", issueData);

    // validate data
    const priority = validateIssuePriority(issueData.priority);

    if (!priority) {
      throw new Error("Invalid priority");
    }

    const response = await axios.post(
      `${process.env.PLANE_API_BASE_URL}/api/v1/workspaces/${process.env.PLANE_WORKSPACE_SLUG}/projects/${process.env.PLANE_PROJECT_ID}/issues/`,
      {
        id: issueData.id,
        created_at: issueData.created_at,
        updated_at: issueData.updated_at,
        estimate_point: issueData.estimate_point,
        name: issueData.name,
        description_html: issueData.description_html,
        description_stripped: issueData.description_stripped,
        priority: issueData.priority,
        start_date: issueData.start_date,
        target_date: issueData.target_date,
        // sequence_id: issueData.sequence_id,
        // sort_order: issueData.sort_order,
        completed_at: issueData.completed_at,
        archived_at: issueData.archived_at,
        is_draft: issueData.is_draft,
        created_by: issueData.created_by,
        updated_by: issueData.updated_by,
        project: issueData.project,
        workspace: issueData.workspace,
        parent: issueData.parent,
        state: issueData.markdown.isCompleted
          ? stateOfIssues["done"]
          : stateOfIssues["todo"],
        assignees: issueData.assignees,
        labels: issueData.labels,
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
      console.log(chalk.green(`    ✅ Issue created: ${response.data}`));
      return response.data;
    } else {
      throw new Error(`Unexpected response status: ${response.status}`);
    }
  } catch (error) {
    console.log(chalk.yellow(`    ⚠️  Error: ${error.message}`));
  }
}

/**
 * Get all issues from Plane
 * @returns {Array} Array of issues
 */
export async function getIssues() {
  try {
    const response = await axios.get(
      `${process.env.PLANE_API_BASE_URL}/api/v1/workspaces/${process.env.PLANE_WORKSPACE_SLUG}/projects/${process.env.PLANE_PROJECT_ID}/issues/`,
      {
        headers: {
          "X-API-Key": process.env.PLANE_API_KEY,
        },
      }
    );

    if (response.status === 200) {
      console.log(chalk.green(`    ✅ Issues fetched: ${response.data}`));

      return response.data.results;
    } else {
      throw new Error(`Unexpected response status: ${response.status}`);
    }
  } catch (error) {
    console.log(chalk.yellow(`    ⚠️  Error: ${error.message}`));
  }
}

/**
 * Rename an issue in Plane
 * @param {Object} issueData - Issue data with ID
 * @returns {Object} Updated issue response
 */
export async function renameIssue(issueData) {
  try {
    const response = await axios.patch(
      `${process.env.PLANE_API_BASE_URL}/api/v1/workspaces/${process.env.PLANE_WORKSPACE_SLUG}/projects/${process.env.PLANE_PROJECT_ID}/issues/${issueData.id}`,
      {
        name: "BE-MONITOR",
      },
      {
        headers: {
          "X-API-Key": process.env.PLANE_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status === 200) {
      console.log(chalk.green(`    ✅ Issue renamed: ${response.data}`));
      return response.data;
    } else {
      throw new Error(`Unexpected response status: ${response.status}`);
    }
  } catch (error) {
    console.log(chalk.yellow(`    ⚠️  Error: ${error.message}`));
  }
}

function validateIssuePriority(priority) {
  return ["none", "low", "medium", "high", "urgent"].includes(priority);
}
