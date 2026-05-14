import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Todo, todoInputSchema, todoUpdateSchema } from "../models/todo";
import { ProjectRepository } from "../repositories/ProjectRepository";
import { TodoRepository } from "../repositories/TodoRepository";
import { toTextContent, toMessageContent } from "../utils/response";
import { McpNotFoundError } from "../utils/errors";

export function registerTodoTools(
  server: McpServer,
  projectRepo: ProjectRepository,
  todoRepo: TodoRepository,
) {
  server.registerTool(
    "create_todo",
    { title: "Create a new todo in a project", inputSchema: todoInputSchema },
    async ({ projectId, title, description, priority }) => {
      try {
        await projectRepo.findByIdOrThrow(projectId);
        const todo: Todo = {
          id: crypto.randomUUID(),
          projectId,
          title,
          description: description || "",
          status: "pending",
          priority: priority || "medium",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await todoRepo.save(todo);
        return toTextContent(todo);
      } catch (error) {
        if (error instanceof McpNotFoundError) throw error;
        throw new Error(
          `Failed to create todo: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    },
  );

  server.registerTool(
    "get_todo_by_id",
    {
      title: "Get a specific todo by Id",
      inputSchema: { todoId: z.string().describe("Todo Id") },
    },
    async ({ todoId }) => {
      try {
        const todo = await todoRepo.findByIdOrThrow(todoId);
        return toTextContent(todo);
      } catch (error) {
        if (error instanceof McpNotFoundError) throw error;
        throw new Error(
          `Failed to get todo: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    },
  );

  server.registerTool(
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
      try {
        await projectRepo.findByIdOrThrow(projectId);
        let todos = await todoRepo.findAllByProject(projectId);
        if (status && status !== "all") {
          todos = todos.filter((t) => t.status === status);
        }
        return toTextContent(todos);
      } catch (error) {
        if (error instanceof McpNotFoundError) throw error;
        throw new Error(
          `Failed to list todos: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    },
  );

  server.registerTool(
    "update_todo",
    { title: "Update a todo's properties", inputSchema: todoUpdateSchema },
    async ({ todoId, title, description, status, priority }) => {
      try {
        const todo = await todoRepo.findByIdOrThrow(todoId);
        if (title !== undefined) todo.title = title;
        if (description !== undefined) todo.description = description;
        if (status !== undefined) todo.status = status;
        if (priority !== undefined) todo.priority = priority;
        todo.updatedAt = new Date().toISOString();
        await todoRepo.save(todo);
        return toTextContent(todo);
      } catch (error) {
        if (error instanceof McpNotFoundError) throw error;
        throw new Error(
          `Failed to update todo: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    },
  );

  server.registerTool(
    "delete_todo",
    {
      title: "Delete todo from a project",
      inputSchema: { todoId: z.string().describe("Todo Id") },
    },
    async ({ todoId }) => {
      try {
        const todo = await todoRepo.findByIdOrThrow(todoId);
        await todoRepo.delete(todo);
        return toMessageContent(`Todo ${todoId} is deleted`);
      } catch (error) {
        if (error instanceof McpNotFoundError) throw error;
        throw new Error(
          `Failed to delete todo: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    },
  );
}
