import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Project, projectInputSchema } from "../models/project";
import { ProjectRepository } from "../repositories/ProjectRepository";
import { TodoRepository } from "../repositories/TodoRepository";
import { toTextContent, toMessageContent } from "../utils/response";
import { McpNotFoundError } from "../utils/errors";

export function registerProjectTools(
  server: McpServer,
  projectRepo: ProjectRepository,
  todoRepo: TodoRepository,
) {
  server.registerTool(
    "create_project",
    { title: "Create a new project", inputSchema: projectInputSchema },
    async ({ name, description }) => {
      try {
        const project: Project = {
          id: crypto.randomUUID(),
          name,
          description: description || "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await projectRepo.save(project);
        return toTextContent(project);
      } catch (error) {
        if (error instanceof McpNotFoundError) throw error;
        throw new Error(
          `Failed to create project: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    },
  );

  server.registerTool(
    "list_project",
    { title: "List all projects" },
    async () => {
      try {
        const projects = await projectRepo.findAll();
        return toTextContent(projects);
      } catch (error) {
        if (error instanceof McpNotFoundError) throw error;
        throw new Error(
          `Failed to list projects: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    },
  );

  server.registerTool(
    "get_project_by_Id",
    {
      title: "Get a specific project by Id",
      inputSchema: { projectId: z.string().describe("Project Id") },
    },
    async ({ projectId }) => {
      try {
        const project = await projectRepo.findByIdOrThrow(projectId);
        const todos = await todoRepo.findAllByProject(projectId);
        return toTextContent({ project, todos });
      } catch (error) {
        if (error instanceof McpNotFoundError) throw error;
        throw new Error(
          `Failed to get project: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    },
  );

  server.registerTool(
    "delete_project_by_Id",
    {
      title: "Delete a project and all its todos",
      inputSchema: { projectId: z.string().describe("Project Id") },
    },
    async ({ projectId }) => {
      try {
        await projectRepo.findByIdOrThrow(projectId);
        await todoRepo.deleteAllByProject(projectId);
        await projectRepo.delete(projectId);
        return toMessageContent(
          `Project ${projectId} and all its todos have been deleted!`,
        );
      } catch (error) {
        if (error instanceof McpNotFoundError) throw error;
        throw new Error(
          `Failed to delete project: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    },
  );
}
