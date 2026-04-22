"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin (Assuming environment variables are used for authentication in Vercel/Cloudflare)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(), // Relies on GOOGLE_APPLICATION_CREDENTIALS
    });
}
const db = admin.firestore();
// Define the Liquid-Memory MCP Server
const server = new index_js_1.Server({
    name: "liquid-memory-mcp",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
    },
});
// List available tools
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
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
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    if (request.params.name === "search_muscle_memory") {
        const queryStr = String(request.params.arguments?.query);
        const category = request.params.arguments?.category;
        try {
            let memoryRef = db.collection("Muscle_Memory");
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
            const filteredResults = results.filter(item => JSON.stringify(item).toLowerCase().includes(queryStr.toLowerCase()));
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(filteredResults, null, 2) || "No matching memories found.",
                    },
                ],
            };
        }
        catch (error) {
            return {
                isError: true,
                content: [
                    {
                        type: "text",
                        text: `Error searching Muscle_Memory: ${error.message}`,
                    },
                ],
            };
        }
    }
    throw new Error(`Unknown tool: ${request.params.name}`);
});
// Start the server using stdio transport (Standard for MCP servers)
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.error("Liquid-Memory MCP Server running on stdio");
}
main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});
