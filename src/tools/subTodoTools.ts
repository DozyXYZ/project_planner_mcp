import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  SubTodo,
  subTodoInputSchema,
  subTodoUpdateSchema,
} from "../models/todo";
import { TodoRepository } from "../repositories/TodoRepository";
import { toTextContent, toMessageContent } from "../utils/response";
import { McpNotFoundError } from "../utils/errors";

export function registerSubTodoTools(
  server: McpServer,
  todoRepo: TodoRepository,
) {
  server.registerTool(
    "create_subtodo",
    {
      title: "Create a new subTodo in a todo",
      inputSchema: subTodoInputSchema,
    },
    async ({ todoId, title, description }) => {
      try {
        const subTodo: SubTodo = {
          id: crypto.randomUUID(),
          todoId,
          title,
          description: description || "",
          status: "pending",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const updatedTodo = await todoRepo.createSubTodo(todoId, subTodo);

        return toTextContent(updatedTodo);
      } catch (error) {
        if (error instanceof McpNotFoundError) throw error;
        throw new Error(
          `Failed to create subtodo: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    },
  );

  server.registerTool(
    "list_subtodo",
    {
      title: "List all todos in a todo",
      inputSchema: { todoId: z.string().describe("Parent todo Id") },
    },
    async ({ todoId }) => {
      try {
        const todo = await todoRepo.findByIdOrThrow(todoId);

        return toTextContent(todo.subTodos);
      } catch (error) {
        if (error instanceof McpNotFoundError) throw error;
        throw new Error(
          `Failed to list subtodos: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    },
  );

  server.registerTool(
    "get_subtodo_by_id",
    {
      title: "Get a specific subtodo by Id",
      inputSchema: {
        todoId: z.string().describe("Parent todo Id"),
        subTodoId: z.string().describe("Subtodo Id"),
      },
    },
    async ({ todoId, subTodoId }) => {
      try {
        const todo = await todoRepo.findByIdOrThrow(todoId);
        const subTodo = todo.subTodos.find((s) => s.id === subTodoId);

        if (!subTodo) throw new McpNotFoundError("SubTodo", subTodoId);

        return toTextContent(subTodo);
      } catch (error) {
        if (error instanceof McpNotFoundError) throw error;
        throw new Error(
          `Failed to get subtodo: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    },
  );

  server.registerTool(
    "update_subtodo",
    {
      title: "Update a subtodo's properties",
      inputSchema: subTodoUpdateSchema,
    },
    async ({ todoId, subTodoId, title, description, status }) => {
      try {
        const updatedTodo = await todoRepo.updateSubTodo(todoId, subTodoId, {
          title,
          description,
          status,
        });
        const subTodo = updatedTodo.subTodos.find((s) => s.id === subTodoId);

        return toTextContent(subTodo);
      } catch (error) {
        if (error instanceof McpNotFoundError) throw error;
        throw new Error(
          `Failed to update subtodo: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    },
  );

  server.registerTool(
    "delete_subtodo",
    {
      title: "Delete a subtodo from a todo",
      inputSchema: {
        todoId: z.string().describe("Parent todo Id"),
        subTodoId: z.string().describe("Subtodo Id"),
      },
    },
    async ({ todoId, subTodoId }) => {
      try {
        await todoRepo.deleteSubTodo(todoId, subTodoId);
        return toMessageContent(`Subtodo ${subTodoId} is deleted`);
      } catch (error) {
        if (error instanceof McpNotFoundError) throw error;
        throw new Error(
          `Failed to delete subtodo: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    },
  );
}
