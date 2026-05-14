import { Todo } from "../models/todo";

export class TodoRepository {
  constructor(private kv: KVNamespace) {}

  private async getIdList(projectId: string): Promise<string[]> {
    const data = await this.kv.get(`project:${projectId}:todos`);

    return data ? JSON.parse(data) : [];
  }

  async findById(todoId: string): Promise<Todo | null> {
    const data = await this.kv.get(`todo:${todoId}`);

    return data ? (JSON.parse(data) as Todo) : null;
  }

  async findByIdOrThrow(todoId: string): Promise<Todo> {
    const todo = await this.findById(todoId);

    if (!todo) throw new Error(`Todo with Id: ${todoId} not found`);

    return todo;
  }

  async findAllByProject(projectId: string): Promise<Todo[]> {
    const ids = await this.getIdList(projectId);
    const todos: Todo[] = [];

    for (const id of ids) {
      const data = await this.kv.get(`todo:${id}`);
      if (data) todos.push(JSON.parse(data) as Todo);
    }

    return todos;
  }

  async save(todo: Todo): Promise<void> {
    await this.kv.put(`todo:${todo.id}`, JSON.stringify(todo));

    const ids = await this.getIdList(todo.projectId);

    if (!ids.includes(todo.id)) {
      ids.push(todo.id);
      await this.kv.put(`project:${todo.projectId}:todos`, JSON.stringify(ids));
    }
  }

  async delete(todo: Todo): Promise<void> {
    const ids = await this.getIdList(todo.projectId);
    const updated = ids.filter((id) => id !== todo.id);

    await this.kv.put(
      `project:${todo.projectId}:todos`,
      JSON.stringify(updated),
    );

    await this.kv.delete(`todo:${todo.id}`);
  }

  async deleteAllByProject(projectId: string): Promise<void> {
    const todos = await this.findAllByProject(projectId);

    for (const todo of todos) {
      await this.kv.delete(`todo:${todo.id}`);
    }

    await this.kv.delete(`project:${projectId}:todos`);
  }
}
