import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import { z } from "zod";
import { Project } from "./utils/types/type";

export class MyMCP extends McpAgent {
  // Declares this MCP server's identity
  server = new McpServer({
    name: "Project Planner MCP",
    version: "1.0.0",
  });

  // Typed shorthand to access the KV namespace from Cloudflare env bindings
  private get kv(): KVNamespace {
    return (this.env as Env).PROJECT_PLANNER_STORE;
  }

  // Fetches the master list of project IDs from KV (returns [] if none exist yet)
  private async getProjectList(): Promise<string[]> {
    const listData = await this.kv.get("project:list");

    return listData ? JSON.parse(listData) : [];
  }

  async init() {
    // Registers a tool called "create_project" that the MCP client can invoke
    this.server.registerTool(
      "create_project",
      {
        title: "Create a new project",
        inputSchema: {
          name: z.string().describe("Project name"),
          description: z.string().optional().describe("Project description"),
        },
      },
      async ({ name, description }) => {
        const projectId = crypto.randomUUID();

        // Builds the project object with timestamps
        const project: Project = {
          id: projectId,
          name,
          description: description || "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Persists the project data under its own KV key
        await this.kv.put(`project:${projectId}`, JSON.stringify(project));

        // Appends the new project ID to the global project list and saves it
        const projectList = await this.getProjectList();
        projectList.push(projectId);
        await this.kv.put("project:list", JSON.stringify(projectList));

        // Returns the created project as the tool's response
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(project, null, 2),
            },
          ],
        };
      },
    );
  }
}

export default {
  // Cloudflare Worker entry point — routes incoming requests
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    // Hands off /mcp requests to the MCP agent handler
    if (url.pathname === "/mcp") {
      return MyMCP.serve("/mcp").fetch(request, env, ctx);
    }

    return new Response("Not found", { status: 404 });
  },
};
