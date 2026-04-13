import * as mcpTools from './tools';

const requiredTools = [
  'FirebaseMCP',
  'GitHubMCP',
  'BraveMCP',
  'V0MCP',
  'NeonMCP',
  'RenderMCP',
  'Context7MCP',
  'TurboQuantMCP'
];

let allPassed = true;

async function runTests() {
  for (const toolName of requiredTools) {
    const tool = mcpTools[toolName as keyof typeof mcpTools] as any;
    if (tool) {
      console.log(`[PASS] ${toolName} is defined.`);
      if (tool.testConnection) {
        try {
          const isConnected = await tool.testConnection();
          if (isConnected) {
            console.log(`  └─ [PASS] ${toolName} testConnection passed.`);
          } else {
            console.error(`  └─ [FAIL] ${toolName} testConnection returned false.`);
            allPassed = false;
          }
        } catch (error) {
          console.error(`  └─ [FAIL] ${toolName} testConnection threw an error:`, error);
          allPassed = false;
        }
      } else {
        console.warn(`  └─ [WARN] ${toolName} does not implement testConnection.`);
      }
    } else {
      console.error(`[FAIL] ${toolName} is NOT defined.`);
      allPassed = false;
    }
  }

  if (allPassed) {
    console.log('All required MCP tools are successfully exported and tested!');
    process.exit(0);
  } else {
    console.error('Some required MCP tools failed the tests.');
    process.exit(1);
  }
}

runTests();
