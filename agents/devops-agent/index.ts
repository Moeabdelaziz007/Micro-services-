// DevOps Agent - Monitoring & Self-Healing
// TurboQuant Anti-Cold-Start System Stub

import express from 'express';
import { GitHubMCP, WebSearchMCP } from '../../shared/mcp-core/tools';
import { validateConfig } from '../../shared/config/validator';

const app = express();

// Validate keys
const { valid, missingKeys } = validateConfig(['GITHUB_TOKEN', 'SEARCH_API_KEY']);

if (!valid) {
    console.error(`DevOps Agent startup warning: Missing keys ${missingKeys.join(', ')}`);
}

console.log(`DevOps Agent initializing with tools: ${GitHubMCP.name}, ${WebSearchMCP.name}`);

// Anti-Cold-Start Ping System
const SERVICE_ENDPOINTS = [
    'http://ui-agent:3000/health',
    'http://db-agent:3000/health',
    'http://research-agent:3000/health',
    'http://meta-agent:3000/health'
];

const pingServices = async () => {
    console.log(`[Ping System] Starting ping cycle at ${new Date().toISOString()}`);

    for (const endpoint of SERVICE_ENDPOINTS) {
        try {
            const response = await fetch(endpoint);
            if (response.ok) {
                console.log(`[Ping Success] ${endpoint}: ${response.status}`);
            } else {
                console.error(`[Ping Failed] ${endpoint}: ${response.status}`);
            }
        } catch (error) {
            console.error(`[Ping Error] ${endpoint}:`, error instanceof Error ? error.message : error);
        }
    }
};

// Set interval to 5 minutes (300,000 ms)
setInterval(pingServices, 5 * 60 * 1000);

// Initial ping on startup
pingServices();

app.get('/health', (req, res) => {
    res.send('DevOps Agent is running with GitHub and WebSearch MCPs');
});

app.listen(3000, () => {
    console.log('DevOps Agent listening on port 3000');
});
