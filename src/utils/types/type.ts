export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Todo {
  id: string;
  projectId: string;
  title: string;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  description: string;
  createdAt: string;
  updatedAt: string;
}
