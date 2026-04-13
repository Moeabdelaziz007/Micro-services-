import express from 'express';
import { DevKnowledgeMCP, BigQueryMCP, MapsMCP } from '../../shared/mcp-core/tools';

const app = express();

console.log(`Research Agent initializing with tools: ${DevKnowledgeMCP.name}, ${BigQueryMCP.name}, ${MapsMCP.name}`);

app.get('/health', (req, res) => {
    res.send('Research Agent is running with DevKnowledge, BigQuery, and Maps MCPs');
});

app.listen(3000, () => {
    console.log('Research Agent listening on port 3000');
});
