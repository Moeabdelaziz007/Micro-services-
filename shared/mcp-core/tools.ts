// Shared MCP Tool Definitions

export interface MCPTool {
  id: string;
  name: string;
  description: string;
}

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
