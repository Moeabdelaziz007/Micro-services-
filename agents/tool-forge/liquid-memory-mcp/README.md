# Liquid-Memory MCP Server

A zero-cost MCP (Model Context Protocol) server designed to connect AI agents (like Gemini) directly to a Firestore database (`Muscle_Memory`). This allows agents to perform semantic searches and retrieve previously acquired knowledge without consuming reasoning tokens.

## Features
- **Zero-Cost Deployment:** Designed to be deployed on serverless/edge environments like Vercel or Cloudflare Workers (Scale-to-Zero).
- **MCP Integration:** Exposes standard MCP tools for agents to query.
- **Firestore Connection:** Reads directly from the `Muscle_Memory` collection.

## Setup
1. `npm install`
2. Set up Firebase Application Default Credentials (e.g., `GOOGLE_APPLICATION_CREDENTIALS`).
3. `npm run build`

## Tools Provided
- `search_muscle_memory`: Searches the database for specific patterns or skills.
