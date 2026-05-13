import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import { z } from "zod";
import { Project, Todo } from "./utils/types/type";

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

  // Fetches the list of todo IDs for a specific project from KV
  private async getTodoList(projectId: string): Promise<string[]> {
    const listData = await this.kv.get(`project:${projectId}:todos`);
    return listData ? JSON.parse(listData) : [];
  }

  private async getTodosByProject(projectId: string): Promise<Todo[]> {
    const todoList = await this.getTodoList(projectId);
    const todos: Todo[] = [];

    for (const todoId of todoList) {
      const todoData = await this.kv.get(`todo:${todoId}`);
      if (todoData) {
        todos.push(JSON.parse(todoData));
      }
    }

    return todos;
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

    this.server.registerTool(
      "list_project",
      { title: "List all projects" },
      async () => {
        const projectList = await this.getProjectList();

        const projects = (
          await Promise.all(
            projectList.map((projectId) => this.kv.get(`project:${projectId}`)),
          )
        )
          .filter(Boolean)
          .map((projectData) => JSON.parse(projectData!) as Project);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(projects, null, 2),
            },
          ],
        };
      },
    );

    this.server.registerTool(
      "get_project_by_Id",
      {
        title: "Get a specific project by Id",
        inputSchema: { projectId: z.string().describe("Project Id") },
      },
      async ({ projectId }) => {
        const projectData = await this.kv.get(`project:${projectId}`);

        if (!projectData) {
          throw new Error(`Project with this Id:${projectId} not found`);
        }

        const project: Project = JSON.parse(projectData);
        const todos = await this.getTodosByProject(projectId);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ project, todos }, null, 2),
            },
          ],
        };
      },
    );

    this.server.registerTool(
      "delete_project_by_Id",
      {
        title: "Delete a project and all its todos",
        inputSchema: { projectId: z.string().describe("Project Id") },
      },
      async ({ projectId }) => {
        const projectData = await this.kv.get(`project:${projectId}`);

        if (!projectData) {
          throw new Error(`Project with this Id:${projectId} not found`);
        }

        const todos = await this.getTodosByProject(projectId);

        for (const todo of todos) {
          await this.kv.delete(`todo:${todo.id}`);
        }

        await this.kv.delete(`project:${projectId}:todos`);
        await this.kv.delete(`project:${projectId}`);

        const projectList = await this.getProjectList();
        const updatedList = projectList.filter((id) => id != projectId);

        await this.kv.put("project:list", JSON.stringify(updatedList));
        return {
          content: [
            {
              type: "text",
              text: `Project ${projectId} and all its todos have been deleted!`,
            },
          ],
        };
      },
    );

    this.server.registerTool(
      "create_todo",
      {
        title: "Create a new todo in a project",
        inputSchema: {
          projectId: z.string().describe("Project Id"),
          title: z.string().describe("Todo title"),
          description: z.string().optional().describe("Todo description"),
          priority: z
            .enum(["low", "medium", "high"])
            .optional()
            .describe("Todo priority"),
        },
      },
      async ({ projectId, title, description, priority }) => {
        const projectData = await this.kv.get(`project:${projectId}`);

        if (!projectData) {
          throw new Error(`Project with this id:${projectId} not found`);
        }

        const todoId = crypto.randomUUID();

        const todo: Todo = {
          id: todoId,
          projectId: projectId,
          title,
          description: description || "",
          status: "pending",
          priority: priority || "medium",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await this.kv.put(`todo:${todoId}`, JSON.stringify(todo));

        const todoList = await this.getTodoList(projectId);
        todoList.push(todoId);

        await this.kv.put(
          `project:${projectId}:todos`,
          JSON.stringify(todoList),
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(todo, null, 2),
            },
          ],
        };
      },
    );

    this.server.registerTool(
      "get_todo_by_id",
      {
        title: "Get a specific todo by Id",
        inputSchema: {
          todoId: z.string().describe("Todo Id"),
        },
      },
      async ({ todoId }) => {
        const todoData = await this.kv.get(`todo:${todoId}`);

        if (!todoData) {
          throw new Error(`Todo with Id: ${todoId} not found`);
        }

        const todo: Todo = JSON.parse(todoData);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(todo, null, 2),
            },
          ],
        };
      },
    );

    this.server.registerTool(
      "list_todos_in_a_project",
      {
        title: "List all todos in a project",
        inputSchema: {
          projectId: z.string().describe("Project Id"),
          status: z
            .enum(["pending", "in_progress", "completed", "all"])
            .optional()
            .describe("Filter by status"),
        },
      },
      async ({ projectId, status }) => {
        const projectData = await this.kv.get(`project:${projectId}`);

        if (!projectData) {
          throw new Error(`Project with Id: ${projectId} not found`);
        }

        let todos = await this.getTodosByProject(projectId);

        if (status && status !== "all") {
          todos = todos.filter((todo) => todo.status === status);
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(todos, null, 2),
            },
          ],
        };
      },
    );

    this.server.registerTool(
      "update_todo",
      {
        title: "Update a todo's properties",
        inputSchema: {
          todoId: z.string().describe("Todo Id"),
          title: z.string().optional().describe("New todo title"),
          description: z.string().optional().describe("New todo description"),
          status: z
            .enum(["pending", "in_progress", "completed"])
            .optional()
            .describe("New todo status"),
          priority: z
            .enum(["low", "medium", "high"])
            .optional()
            .describe("New todo priority"),
        },
      },
      async ({ todoId, title, description, status, priority }) => {
        const todoData = await this.kv.get(`todo:${todoId}`);

        if (!todoData) {
          throw new Error(`Todo with Id: ${todoId} not found`);
        }

        const todo: Todo = JSON.parse(todoData);

        if (title !== undefined) todo.title = title;
        if (description !== undefined) todo.description = description;
        if (status !== undefined) todo.status = status;
        if (priority !== undefined) todo.priority = priority;
        todo.updatedAt = new Date().toISOString();

        await this.kv.put(`todo:${todoId}`, JSON.stringify(todo));

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(todo, null, 2),
            },
          ],
        };
      },
    );

    this.server.registerTool(
      "delete_todo",
      {
        title: "Delete todo from a project",
        inputSchema: {
          todoId: z.string().describe("Todo Id"),
        },
      },
      async ({ todoId }) => {
        const todoData = await this.kv.get(`todo:${todoId}`);

        if (!todoData) {
          throw new Error(`Todo with Id: ${todoId} not found`);
        }

        const todo: Todo = JSON.parse(todoData);

        const todoList = await this.getTodoList(todo.projectId);
        const updatedList = todoList.filter((id) => id !== todoId);
        await this.kv.put(
          `project:${todo.projectId}:todos`,
          JSON.stringify(updatedList),
        );

        await this.kv.delete(`todo:${todoId}`);

        return {
          content: [
            {
              type: "text",
              text: `Todo ${todoId} is deleted`,
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
