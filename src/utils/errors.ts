export class McpNotFoundError extends Error {
  constructor(entity: string, id: string) {
    super(`${entity} with Id: ${id} not found`);
    this.name = "McpNotFoundError";
  }
}
