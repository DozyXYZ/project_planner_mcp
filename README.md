# Remote MCP Server on Cloudflare Workers

This project is a **remote Model Context Protocol (MCP) server** for project and todo management, designed to run on [Cloudflare Workers](https://developers.cloudflare.com/workers/). It provides a set of tools for managing projects and todos, accessible via the MCP protocol.

---

## Features

- **Project and Todo Management**: Create, list, and manage projects and todos via MCP tools.
- **Cloudflare Workers KV**: Uses Cloudflare's Key-Value storage for persistence.
- **Remote MCP Protocol**: Exposes tools for use in Cloudflare AI Playground, Claude Desktop, and other MCP clients.
- **Extensible**: Easily add or customize tools in `src/tools/` and register them in `src/index.ts`.

---

## Quick Start

### 1. Deploy to Cloudflare Workers

[![Deploy to Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/ai/tree/main/demos/remote-mcp-authless)

This will deploy your MCP server to a URL like:

```
https://remote-mcp-server.<your-account>.workers.dev/mcp
```

### 2. Local Development

Clone this repo and install dependencies:

```bash
git clone https://github.com/DozyXYZ/project_planner_mcp.git
cd remote-mcp-server
npm install
```

Start the development server:

```bash
npm run dev
```

### 3. Create Cloudflare KV Namespace

```bash
npx wrangler kv namespace create "PROJECT_PLANNER_STORE"
```

Update `wrangler.jsonc` with the generated KV namespace ID:

```jsonc
"kv_namespaces": [
  {
    "binding": "PROJECT_PLANNER_STORE",
    "id": "<storageID>",
    "remote": true
  }
]
```

---

## Project Structure

- `src/index.ts` — Entry point, MCP server setup, tool registration
- `src/models/` — TypeScript interfaces and schemas for Project and Todo
- `src/repositories/` — Data access for projects and todos (using KV)
- `src/tools/` — Tool registration for MCP (projectTools, todoTools)
- `src/utils/` — Error handling and response formatting

---

## Available Scripts

- `npm run dev` — Start local dev server
- `npm run deploy` — Deploy to Cloudflare Workers
- `npm run type-check` — TypeScript type checking
- `npm run format` — Format code with oxfmt
- `npm run lint:fix` — Lint and auto-fix code

---

## MCP Tools

The following tools are registered and available via the MCP protocol:

### Project Tools

- `create_project` — Create a new project (name, description)
- `list_project` — List all projects
- `get_project_by_Id` — Get a project by ID (with todos)
- `delete_project_by_Id` — Delete a project and all its todos

### Todo Tools

- `create_todo` — Create a new todo in a project (projectId, title, description, priority)
- `list_todos_in_a_project` — List all todos for a project (optionally filter by status)
- `update_todo` — Update a todo (title, description, status, priority)
- `get_todo_by_id` — Get a todo by ID
- `delete_todo` — Delete a todo from a project

### SubTodo Tools

- `create_subtodo` — Create a new subtodo in a todo (todoId, title, description)
- `list_subtodo` — List all subtodos for a todo (todoId)
- `get_subtodo_by_id` — Get a subtodo by ID (todoId, subTodoId)
- `update_subtodo` — Update a subtodo (todoId, subTodoId, title, description, status)
- `delete_subtodo` — Delete a subtodo from a todo (todoId, subTodoId)

---

## Usage

### Connect from Claude Desktop

You can also connect to your remote MCP server from local MCP clients using the [mcp-remote proxy](https://www.npmjs.com/package/mcp-remote).

Follow [Anthropic's Quickstart](https://modelcontextprotocol.io/quickstart/user) and in Claude Desktop go to Settings > Developer > Edit Config. Example config:

```json
{
  "mcpServers": {
    "project_planner_mcp": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "http://localhost:8787/mcp" // or https://remote-mcp-server.<your-account>.workers.dev/mcp
      ]
    }
  }
}
```

Restart Claude and you should see the tools become available.

---

## Customizing Tools

To add or modify tools, edit the files in `src/tools/` and register them in `src/index.ts` inside the `init()`.

See [Cloudflare MCP Tools documentation](https://developers.cloudflare.com/agents/model-context-protocol/tools/) for more info.

---

## Dependencies

- [agents](https://www.npmjs.com/package/agents)
- [zod](https://www.npmjs.com/package/zod)
- [wrangler](https://www.npmjs.com/package/wrangler)
- [TypeScript](https://www.typescriptlang.org/)

---
