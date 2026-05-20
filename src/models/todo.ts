import { z } from "zod";

// Todo
export interface Todo {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  subTodos: SubTodo[];
  createdAt: string;
  updatedAt: string;
}

export const todoInputSchema = {
  projectId: z.string().describe("Project Id"),
  title: z.string().describe("Todo title"),
  description: z.string().optional().describe("Todo description"),
  priority: z
    .enum(["low", "medium", "high"])
    .optional()
    .describe("Todo priority"),
};

export const todoUpdateSchema = {
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
};

// SubTodo
export interface SubTodo {
  id: string;
  todoId: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed";
  createdAt: string;
  updatedAt: string;
}

export const subTodoInputSchema = {
  todoId: z.string().describe("Parent todo Id"),
  title: z.string().describe("Subtodo title"),
  description: z.string().optional().describe("Subtodo description"),
};

export const subTodoUpdateSchema = {
  todoId: z.string().describe("Parent todo Id"),
  subTodoId: z.string().describe("Subtodo Id"),
  title: z.string().optional().describe("New subtodo title"),
  description: z.string().optional().describe("New subtodo description"),
  status: z
    .enum(["pending", "in_progress", "completed"])
    .optional()
    .describe("New todo status"),
};
