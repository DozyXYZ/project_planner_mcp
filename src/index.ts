import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import { ProjectRepository } from "./repositories/ProjectRepository";
import { TodoRepository } from "./repositories/TodoRepository";
import { registerProjectTools } from "./tools/projectTools";
import { registerTodoTools } from "./tools/todoTools";

export class MyMCP extends McpAgent {
  server = new McpServer({
    name: "Project Planner MCP",
    version: "1.0.0",
  });

  async init() {
    const kv = (this.env as Env).PROJECT_PLANNER_STORE;
    const projectRepo = new ProjectRepository(kv);
    const todoRepo = new TodoRepository(kv);

    registerProjectTools(this.server, projectRepo, todoRepo);
    registerTodoTools(this.server, projectRepo, todoRepo);
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
