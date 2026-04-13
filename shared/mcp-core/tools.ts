// Shared MCP Tool Definitions

export interface MCPTool {
  id: string;
  name: string;
  description: string;
  testConnection?: () => Promise<boolean>;
}

// Core Memory & Knowledge Tools
export const FirebaseMCP: MCPTool = {
  id: 'firebase',
  name: 'Firebase / GCP',
  description: 'Databases, Authentication, and Hosting (Free Tier)',
  testConnection: async () => true
};

export const FirestoreMCP: MCPTool = {
  id: 'firestore-mcp',
  name: 'Firestore Memory',
  description: 'Directly query and store agent skills/patterns in Firestore.',
  testConnection: async () => true
};

export const DevKnowledgeMCP: MCPTool = {
  id: 'dev-knowledge-mcp',
  name: 'Developer Knowledge',
  description: 'Access Google Cloud & Firebase documentation for accurate coding.',
  testConnection: async () => true
};

export const Context7MCP: MCPTool = {
  id: 'context7',
  name: 'Context7',
  description: 'Context and Memory Management (Zero-Cost)',
  testConnection: async () => true
};

export const TurboQuantMCP: MCPTool = {
  id: 'turboquant',
  name: 'TurboQuant',
  description: 'Model Compression (Zero-Cost)',
  testConnection: async () => true
};

// Analytics & Geospatial Tools
export const BigQueryMCP: MCPTool = {
  id: 'bigquery-mcp',
  name: 'BigQuery Analytics',
  description: 'Analyze large datasets.',
  testConnection: async () => true
};

export const MapsMCP: MCPTool = {
  id: 'maps-mcp',
  name: 'Maps Geospatial',
  description: 'Perform complex geospatial queries.',
  testConnection: async () => true
};

// Developer & Automation Tools (Awesome MCP Servers)
export const GitHubMCP: MCPTool = {
  id: 'github-mcp',
  name: 'GitHub/Git',
  description: 'Read repos, analyze code, perform commits and pull requests.',
  testConnection: async () => true
};

export const DatabaseMCP: MCPTool = {
  id: 'db-mcp',
  name: 'SQLite/Postgres',
  description: 'Manage local databases and store user data.',
  testConnection: async () => true
};

export const WebSearchMCP: MCPTool = {
  id: 'web-search-mcp',
  name: 'Web Search/Fetch',
  description: 'Browse the web, fetch data from pages, and analyze content.',
  testConnection: async () => true
};

export const BraveMCP: MCPTool = {
  id: 'brave',
  name: 'Brave Search',
  description: 'Web Search (Free API Tier)',
  testConnection: async () => true
};

export const V0MCP: MCPTool = {
  id: 'v0',
  name: 'v0',
  description: 'UI Generation (Free Tier)',
  testConnection: async () => true
};

export const NeonMCP: MCPTool = {
  id: 'neon',
  name: 'Neon',
  description: 'Postgres databases (Free Tier)',
  testConnection: async () => true
};

export const RenderMCP: MCPTool = {
  id: 'render',
  name: 'Render',
  description: 'Deploy services (Free Tier)',
  testConnection: async () => true
};

// Infrastructure & Performance Tools
export const GroqMCP: MCPTool = {
  id: 'groq-mcp',
  name: 'Groq Cloud',
  description: 'High-speed inference for Llama 3/Mixtral (Voice-First).',
  testConnection: async () => true
};

export const CloudflareMCP: MCPTool = {
  id: 'cloudflare-mcp',
  name: 'Cloudflare Workers',
  description: 'Deploy MCP servers and microservices at the edge.',
  testConnection: async () => true
};
