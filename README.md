# Task Manager API (Azure Function + Cosmos DB)

# What it does?
-- Health check: GET/api/ping
-- create a task: POST/api/tasks (writes to Cosmos DB)
-- List tasks: GET/api/tasks (reads from Cosmos DB)

# Services
-- Compute: Azure Function App (Node.js)
-- Data: Azure Cosmos DB (SQL API)
-- Monitoring: Application Insights



## How we built & deployed (high level)
1. Created Azure resources:
   - Resource Group
   - Cosmos DB (SQL API) + Database + Container
   - Storage Account (required by Azure Functions runtime)
   - Function App (Node.js)
   - Application Insights (monitoring)

2. Configured secrets/settings (no secrets in code):
   - Local: `local.settings.json` used for local development
   - Cloud: Function App → Environment variables (Application settings)
     - `COSMOS_CONNECTION_STRING`
     - `COSMOS_DB_NAME`
     - `COSMOS_CONTAINER_NAME`
     - `APPLICATIONINSIGHTS_CONNECTION_STRING`

3. Implemented the API:
   - `GET /api/ping` (health check)
   - `POST /api/tasks` writes a task to Cosmos DB
   - `GET /api/tasks` reads tasks from Cosmos DB

4. Tested locally:
   - `npm install`
   - `func start`
   - Verified POST + GET worked on `http://localhost:7071`

5. Deployed to Azure:
   - VS Code → Azure extension → Deploy to Function App
   - Verified the public endpoints work using curl

6. Verified monitoring:
   - Application Insights → Transaction Search shows requests for `/api/tasks`


# Public API (Cloud) -- how to use
# Basde url:
  tasks: https://msit3470finalfunction-h6frhccqhtgab7dr.eastus-01.azurewebsites.net/api/tasks
# Health Check:
https://msit3470finalfunction-h6frhccqhtgab7dr.eastus-01.azurewebsites.net/api/ping

# Create task (Write)
curl -X POST "https://msit3470finalfunction-h6frhccqhtgab7dr.eastus-01.azurewebsites.net/api/tasks" -H "Content-Type: application/json" -d "{\"title\":\"Cloud task test\",\"dueDate\":\"2025-12-14\"}"


# List task (Read)
curl "https://msit3470finalfunction-h6frhccqhtgab7dr.eastus-01.azurewebsites.net/api/tasks"


## Monitoring (Application Insights)
Monitoring is enabled via Azure Application Insights. We validated telemetry by generating requests to:
- `GET/POST /api/tasks`
- `PATCH /api/tasks/{id}`