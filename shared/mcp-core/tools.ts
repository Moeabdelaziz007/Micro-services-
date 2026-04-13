// Shared MCP Tool Definitions

export interface MCPTool {
  id: string;
  name: string;
  description: string;
}

// Core Memory & Knowledge Tools
export const FirestoreMCP: MCPTool = {
  id: 'firestore-mcp',
  name: 'Firestore Memory',
  description: 'Directly query and store agent skills/patterns in Firestore.'
};

export const DevKnowledgeMCP: MCPTool = {
  id: 'dev-knowledge-mcp',
  name: 'Developer Knowledge',
  description: 'Access Google Cloud & Firebase documentation for accurate coding.'
};

// Analytics & Geospatial Tools
export const BigQueryMCP: MCPTool = {
  id: 'bigquery-mcp',
  name: 'BigQuery Analytics',
  description: 'Analyze large datasets.'
};

export const MapsMCP: MCPTool = {
  id: 'maps-mcp',
  name: 'Maps Geospatial',
  description: 'Perform complex geospatial queries.'
};

// Developer & Automation Tools (Awesome MCP Servers)
export const GitHubMCP: MCPTool = {
  id: 'github-mcp',
  name: 'GitHub/Git',
  description: 'Read repos, analyze code, perform commits and pull requests.'
};

export const DatabaseMCP: MCPTool = {
  id: 'db-mcp',
  name: 'SQLite/Postgres',
  description: 'Manage local databases and store user data.'
};

export const WebSearchMCP: MCPTool = {
  id: 'web-search-mcp',
  name: 'Web Search/Fetch',
  description: 'Browse the web, fetch data from pages, and analyze content.'
};

// Infrastructure & Performance Tools
export const GroqMCP: MCPTool = {
  id: 'groq-mcp',
  name: 'Groq Cloud',
  description: 'High-speed inference for Llama 3/Mixtral (Voice-First).'
};

export const CloudflareMCP: MCPTool = {
  id: 'cloudflare-mcp',
  name: 'Cloudflare Workers',
  description: 'Deploy MCP servers and microservices at the edge.'
};

// Web Automation Tools
export const PuppeteerMCP: MCPTool = {
  id: 'puppeteer-mcp',
  name: 'Puppeteer/Playwright',
  description: 'Headless browser automation for complex web interaction, login, and scraping.'
};
