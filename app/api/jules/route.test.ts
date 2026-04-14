import test from 'node:test';
import assert from 'node:assert';
import { POST } from './route.ts';

// Mock NextResponse
// Since we are running in Node.js environment, we need to handle the Next.js specific response
// For the sake of this test, we can check if the response is what we expect.

test('POST returns 401 when JULES_API_KEY is missing', async () => {
  // Save original API Key
  const originalApiKey = process.env.JULES_API_KEY;

  // Ensure API Key is missing
  delete process.env.JULES_API_KEY;

  try {
    const mockReq = {
      json: async () => ({ action: 'get_sources', payload: {} })
    } as unknown as Request;

    const response = await POST(mockReq);

    assert.strictEqual(response.status, 401);

    const body = await response.json();
    assert.strictEqual(body.error, "مفتاح JULES_API_KEY مفقود. يرجى إضافته في إعدادات الأسرار.");
  } finally {
    // Restore original API Key if it existed
    if (originalApiKey) {
      process.env.JULES_API_KEY = originalApiKey;
    }
  }
});
