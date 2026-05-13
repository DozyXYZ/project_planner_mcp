import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import { z } from "zod";
import { Project } from "./utils/types/type";

export class MyMCP extends McpAgent {
  server = new McpServer({
    name: "Project Planner MCP",
    version: "1.0.0",
  });

  async init() {
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

        const project: Project = {
          id: projectId,
          name,
          description: description || "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

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
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    if (url.pathname === "/mcp") {
      return MyMCP.serve("/mcp").fetch(request, env, ctx);
    }

    return new Response("Not found", { status: 404 });
  },
};
