import { Todo, SubTodo } from "../models/todo";
import { McpNotFoundError } from "../utils/errors";

export class TodoRepository {
  constructor(private kv: KVNamespace) {}

  // Todo
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

  // SubTodo
  async createSubTodo(todoId: string, subTodo: SubTodo): Promise<Todo> {
    const todo = await this.findByIdOrThrow(todoId);

    todo.subTodos.push(subTodo);
    todo.updatedAt = new Date().toISOString();

    await this.save(todo);

    return todo;
  }

  private findSubTodoOrThrow(todo: Todo, subTodoId: string): SubTodo {
    const subTodo = todo.subTodos.find((s) => s.id === subTodoId);

    if (!subTodo) throw new McpNotFoundError("SubTodo", subTodoId);

    return subTodo;
  }

  async updateSubTodo(
    todoId: string,
    subTodoId: string,
    fields: {
      title?: string;
      description?: string;
      status?: SubTodo["status"];
    },
  ): Promise<Todo> {
    const todo = await this.findByIdOrThrow(todoId);
    const subTodo = this.findSubTodoOrThrow(todo, subTodoId);

    if (fields.title !== undefined) subTodo.title = fields.title;
    if (fields.description !== undefined)
      subTodo.description = fields.description;
    if (fields.status !== undefined) subTodo.status = fields.status;

    subTodo.updatedAt = new Date().toISOString();
    todo.updatedAt = new Date().toISOString();

    await this.save(todo);

    return todo;
  }

  async deleteSubTodo(todoId: string, subTodoId: string): Promise<Todo> {
    const todo = await this.findByIdOrThrow(todoId);
    this.findSubTodoOrThrow(todo, subTodoId);

    todo.subTodos = todo.subTodos.filter((s) => s.id !== subTodoId);
    todo.updatedAt = new Date().toISOString();

    await this.save(todo);

    return todo;
  }
}
