import axios from "axios";
import chalk from "chalk";
import "dotenv/config";

const stateOfIssues = {
  backlog: "b2339689-0156-490f-b557-0b0b9353916b",
  todo: "b3bcaf66-e3a9-464e-a9fc-3a8d5da5f4bf",
  done: "b3bcaf66-e3a9-464e-a9fc-3a8d5da5f4bf",
  completed: "b3bcaf66-e3a9-464e-a9fc-3a8d5da5f4bf",
};

export async function createIssueInPlane(issueData) {
  try {
    console.log(chalk.green(`Issue creating in Plane...${issueData.name}`));

    console.log("issueData", issueData);

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
        state: "b3bcaf66-e3a9-464e-a9fc-3a8d5da5f4bf",
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

export async function getIssuesInPlane() {
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
      console.log("response.data", response.data);

      return response.data;
    } else {
      throw new Error(`Unexpected response status: ${response.status}`);
    }
  } catch (error) {
    console.log(chalk.yellow(`    ⚠️  Error: ${error.message}`));
  }
}
