import { Project } from "../models/project";

export class ProjectRepository {
  constructor(private kv: KVNamespace) {}

  async getIdList(): Promise<string[]> {
    const data = await this.kv.get("project:list");

    return data ? JSON.parse(data) : [];
  }

  async findById(projectId: string): Promise<Project | null> {
    const data = await this.kv.get(`project:${projectId}`);

    return data ? (JSON.parse(data) as Project) : null;
  }

  async findByIdOrThrow(projectId: string): Promise<Project> {
    const project = await this.findById(projectId);

    if (!project) throw new Error(`Project with Id: ${projectId} not found`);

    return project;
  }

  async findAll(): Promise<Project[]> {
    const ids = await this.getIdList();
    const results = await Promise.all(
      ids.map((id) => this.kv.get(`project:${id}`)),
    );

    return results.filter(Boolean).map((d) => JSON.parse(d!) as Project);
  }

  async save(project: Project): Promise<void> {
    await this.kv.put(`project:${project.id}`, JSON.stringify(project));

    const ids = await this.getIdList();

    if (!ids.includes(project.id)) {
      ids.push(project.id);
      await this.kv.put("project:list", JSON.stringify(ids));
    }
  }

  async delete(projectId: string): Promise<void> {
    await this.kv.delete(`project:${projectId}`);

    const ids = await this.getIdList();
    const updated = ids.filter((id) => id !== projectId);

    await this.kv.put("project:list", JSON.stringify(updated));
  }
}
