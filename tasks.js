const { app } = require("@azure/functions");
const { CosmosClient } = require("@azure/cosmos");
const crypto = require("crypto");

function getCosmos() {
  const conn = process.env.COSMOS_CONNECTION_STRING;
  const dbName = process.env.COSMOS_DB_NAME;
  const containerName = process.env.COSMOS_CONTAINER_NAME;

  if (!conn || !dbName || !containerName) {
    throw new Error(
      "Missing Cosmos env vars. Check local.settings.json / Function App settings."
    );
  }

  const client = new CosmosClient(conn);
  const container = client.database(dbName).container(containerName);
  return { container };
}

app.http("tasks", {
  methods: ["GET", "POST", "PATCH"],
  authLevel: "anonymous",
  route: "tasks/{id?}",
  handler: async (request, context) => {
    try {
      const { container } = getCosmos();

      // READ path: list tasks
      if (request.method === "GET") {
        const query = {
          query: "SELECT * FROM c WHERE c.pk = @pk ORDER BY c.createdAt DESC",
          parameters: [{ name: "@pk", value: "TASK" }],
        };

        const { resources } = await container.items.query(query).fetchAll();
        return { status: 200, jsonBody: resources };
      }

      // WRITE path: create a task
      if (request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        const title = (body.title || "").trim();
        const dueDate = (body.dueDate || "").trim();

        if (!title || !dueDate) {
          return {
            status: 400,
            jsonBody: {
              error: "title and dueDate are required (e.g., dueDate: 2025-12-14)",
            },
          };
        }

        const item = {
          id: crypto.randomUUID(),
          pk: "TASK",
          title,
          dueDate,
          status: "open",
          createdAt: new Date().toISOString(),
        };

        const { resource } = await container.items.create(item);
        return { status: 201, jsonBody: resource };
      }

      // UPDATE path: update a task by id
      if (request.method === "PATCH") {
        const id = request.params?.id;

        if (!id) {
          return {
            status: 400,
            jsonBody: { error: "Task id is required in the URL (PATCH /api/tasks/{id})" },
          };
        }

        const body = await request.json().catch(() => ({}));

        // Only allow updating these fields
        const updates = {};
        if (typeof body.title === "string") updates.title = body.title.trim();
        if (typeof body.dueDate === "string") updates.dueDate = body.dueDate.trim();
        if (typeof body.status === "string") updates.status = body.status.trim(); // e.g., open/done

        if (Object.keys(updates).length === 0) {
          return {
            status: 400,
            jsonBody: {
              error: "Nothing to update. Send at least one of: title, dueDate, status",
            },
          };
        }

        // Read existing item (partition key is pk = "TASK")
        let existing;
        try {
          const readResult = await container.item(id, "TASK").read();
          existing = readResult.resource;
        } catch (e) {
          // Cosmos throws if not found
          return { status: 404, jsonBody: { error: "Task not found" } };
        }

        const updated = {
          ...existing,
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        const { resource } = await container.item(id, "TASK").replace(updated);
        return { status: 200, jsonBody: resource };
      }

      return { status: 405, jsonBody: { error: "Method not allowed" } };
    } catch (err) {
      context.error(err);
      return {
        status: 500,
        jsonBody: { error: "Server error", details: err.message },
      };
    }
  },
});
