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
    const priority = validateIssuePriority(issueData.payload.priority);

    if (!priority) {
      throw new Error("Invalid priority");
    }

    const response = await axios.post(
      `${process.env.PLANE_API_BASE_URL}/api/v1/workspaces/${process.env.PLANE_WORKSPACE_SLUG}/projects/${process.env.PLANE_PROJECT_ID}/issues/`,
      {
        id: issueData.payload.id,
        created_at: issueData.payload.created_at,
        updated_at: issueData.payload.updated_at,
        estimate_point: issueData.payload.estimate_point,
        name: issueData.payload.name,
        description_html: issueData.payload.description_html,
        description_stripped: issueData.payload.description_stripped,
        priority: issueData.payload.priority,
        start_date: issueData.payload.start_date,
        target_date: issueData.payload.target_date,
        // sequence_id: issueData.payload.sequence_id,
        // sort_order: issueData.payload.sort_order,
        completed_at: issueData.payload.completed_at,
        archived_at: issueData.payload.archived_at,
        is_draft: issueData.payload.is_draft,
        created_by: issueData.payload.created_by,
        updated_by: issueData.payload.updated_by,
        project: issueData.payload.project,
        workspace: issueData.payload.workspace,
        parent: issueData.payload.parent,
        state: issueData.is_completed
          ? stateOfIssues["done"]
          : stateOfIssues["todo"],
        assignees: issueData.payload.assignees,
        labels: issueData.payload.labels,
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
export async function getIssues(cursor = "100:0:0") {
  // cursor format: limit:offset:is_prev
  const [limit, offset, is_prev] = cursor.split(":");
  console.log("limit", limit);
  console.log("offset", offset);
  console.log("is_prev", is_prev);

  try {
    const response = await axios.get(
      `${process.env.PLANE_API_BASE_URL}/api/v1/workspaces/${process.env.PLANE_WORKSPACE_SLUG}/projects/${process.env.PLANE_PROJECT_ID}/issues/?per_page=${limit}&cursor=${cursor}`,
      {
        headers: {
          "X-API-Key": process.env.PLANE_API_KEY,
        },
      }
    );

    if (response.status === 200) {
      console.log(
        chalk.green(
          `    ✅ Issues fetched: ${response.data.results.length} issues`
        )
      );

      return {
        next_cursor: response.data.next_cursor,
        prev_cursor: response.data.prev_cursor,
        next_page_results: response.data.next_page_results,
        prev_page_results: response.data.prev_page_results,
        count: response.data.count,
        total_pages: response.data.total_pages,
        total_results: response.data.total_results,
        extra_stats: response.data.extra_stats,
        results: response.data.results,
      };
    } else {
      throw new Error(`Unexpected response status: ${response.status}`);
    }
  } catch (error) {
    console.log(chalk.yellow(`    ⚠️  Error: ${error.message}`));
  }
}

/**
 * Delete a single issue in Plane
 * @param {string} issueId - Issue ID to delete
 * @returns {Object} Deletion response
 */
export async function deleteIssue(issueId) {
  try {
    console.log(chalk.red(`🗑️  Deleting issue: ${issueId}`));

    const response = await axios.delete(
      `${process.env.PLANE_API_BASE_URL}/api/v1/workspaces/${process.env.PLANE_WORKSPACE_SLUG}/projects/${process.env.PLANE_PROJECT_ID}/issues/${issueId}/`,
      {
        headers: {
          "X-API-Key": process.env.PLANE_API_KEY,
        },
      }
    );

    if (response.status === 204) {
      console.log(chalk.green(`    ✅ Issue deleted: ${issueId}`));
      return { success: true, issueId };
    } else {
      throw new Error(`Unexpected response status: ${response.status}`);
    }
  } catch (error) {
    console.log(
      chalk.red(`    ❌ Error deleting issue ${issueId}: ${error.message}`)
    );
    return { success: false, issueId, error: error.message };
  }
}

/**
 * Delete all issues in Plane
 * @param {boolean} confirm - Confirmation flag to prevent accidental deletion
 * @returns {Object} Deletion summary
 */
export async function deleteAllIssues(confirm = false) {
  if (!confirm) {
    console.log(
      chalk.red("⚠️  WARNING: This will delete ALL issues in the project!")
    );
    console.log(
      chalk.yellow("To confirm deletion, call: deleteAllIssues(true)")
    );
    return { error: "Deletion not confirmed" };
  }

  try {
    console.log(chalk.red.bold("🚨 DELETING ALL ISSUES IN PROJECT"));
    console.log(chalk.gray("====================================="));

    const cursor = "15:0:0";
    const data = await getIssues(cursor);

    let page = 0;

    const deleteIssues = [];

    console.log("data", data);

    const issues = data.results;
    for (const issue of issues) {
      await deleteIssue(issue.id);
    }

    // while (page < data.total_pages) {
    //   const issues = data.results;
    //   for (const issue of issues) {
    //     const deleteIssues = await deleteIssue(issue.id);
    //     deleteIssues.push(deleteData);
    //   }

    //   await Promise.all(deleteIssues);

    //   cursor = data.next_cursor;

    //   page++;
    // }
  } catch (error) {
    console.log(chalk.red(`❌ Error in deleteAllIssues: ${error.message}`));
    return { error: error.message };
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
