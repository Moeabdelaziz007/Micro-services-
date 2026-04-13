import express from 'express';
import { FirestoreMCP } from '../../shared/mcp-core/tools';

const app = express();

console.log(`DB Agent initializing with tool: ${FirestoreMCP.name}`);

app.get('/health', (req, res) => {
    res.send('DB Agent is running with Firestore MCP');
});

app.listen(3000, () => {
    console.log('DB Agent listening on port 3000');
});
