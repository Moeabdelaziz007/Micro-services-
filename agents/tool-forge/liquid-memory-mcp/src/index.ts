import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as admin from "firebase-admin";

// Initialize Firebase Admin (Assuming environment variables are used for authentication in Vercel/Cloudflare)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(), // Relies on GOOGLE_APPLICATION_CREDENTIALS
  });
}

const db = admin.firestore();

// Define the Liquid-Memory MCP Server
const server = new Server(
  {
    name: "liquid-memory-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search_muscle_memory",
        description: "Searches the Firestore Muscle_Memory collection for previously acquired skills, patterns, or solutions.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "The search query (e.g., 'React component setup', 'MCP deployment').",
            },
            category: {
              type: "string",
              description: "Optional category to filter by (e.g., 'Research_Skill', 'DevOps_Pattern').",
            },
          },
          required: ["query"],
        },
      },
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "search_muscle_memory") {
    const queryStr = String(request.params.arguments?.query);
    const category = request.params.arguments?.category as string | undefined;

    try {
      let memoryRef: admin.firestore.Query = db.collection("Muscle_Memory");

      if (category) {
        memoryRef = memoryRef.where("category", "==", category);
      }

      // Basic text search (In a real setup, consider using a proper search service or vector embeddings,
      // but sticking to basic Firestore query for zero-cost simplicity)
      // Note: Firestore doesn't support native full-text search, so this is a simplified exact/prefix match
      // or we just return recent documents if query is general.

      const snapshot = await memoryRef.limit(5).get(); // Limit to top 5 results

      const results = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter results loosely based on query string if we fetched everything
      const filteredResults = results.filter(item =>
        JSON.stringify(item).toLowerCase().includes(queryStr.toLowerCase())
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(filteredResults, null, 2) || "No matching memories found.",
          },
        ],
      };
    } catch (error: unknown) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error searching Muscle_Memory: ${(error as Error).message}`,
          },
        ],
      };
    }
  }

  throw new Error(`Unknown tool: ${request.params.name}`);
});

// Start the server using stdio transport (Standard for MCP servers)
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Liquid-Memory MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
