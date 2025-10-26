# API Endpoint Auto-Testing Feature

This feature automatically discovers and tests API endpoints in GitHub repositories for demo purposes.

## Overview

When you click on a repository from the dashboard and navigate to the review page, you can use the "Test API Endpoints" button to:

1. Discover all API endpoints in the repository
2. Set up a test environment (simulated)
3. Execute tests on each endpoint
4. View comprehensive test results

## Features

### 1. Endpoint Discovery

- Automatically finds API endpoints in:
  - Next.js App Router (`route.ts` files)
  - Express.js (`app.get()`, `router.get()`, etc.)
  - Flask (`@app.route()`)
  - FastAPI (`@app.get()`, `@app.post()`, etc.)

### 2. Environment Variable Handling

- Fetches `.env.example` from target repository
- Parses and generates default test values
- Creates temporary configuration for testing

### 3. Automated Testing

- Simulates server startup (demo mode)
- Tests all discovered endpoints
- Captures response status, time, and body
- Provides comprehensive test summary

### 4. UI Components

- Beautiful gradient test summary card
- Detailed results for each endpoint
- Expandable test details
- Visual status indicators (✅ ❌ ⏳)

## Usage

1. Navigate to any repository review page
2. Click the "🧪 Test API Endpoints" button
3. Wait for tests to complete (simulated ~100ms per endpoint)
4. Review test results with expandable details

## Endpoints

- `POST /api/analyze/endpoints` - Discover API endpoints in a repository
- `POST /api/setup/env` - Parse `.env.example` file
- `POST /api/runner/start` - Start test server (demo mode)
- `POST /api/test/execute` - Execute tests on endpoints
- `POST /api/runner/stop` - Stop test server

## Demo Mode

Currently runs in **demo mode** which simulates:

- Server startup and shutdown
- API requests and responses
- Mock test results based on endpoint patterns

For production use, implement:

- Actual Docker container management
- Real HTTP requests to running servers
- Actual environment variable injection

## Future Enhancements

- Support for more framework types
- Real Docker container execution
- Webhook testing
- Authentication testing
- Performance metrics
- Integration with CI/CD pipelines
