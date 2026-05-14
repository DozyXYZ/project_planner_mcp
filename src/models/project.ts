import { z } from "zod";

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export const projectInputSchema = {
  name: z.string().describe("Project name"),
  description: z.string().optional().describe("Project description"),
};
