import { NextResponse } from 'next/server';

const JULES_BASE_URL = 'https://jules.googleapis.com/v1alpha';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, payload } = body;
    const apiKey = process.env.JULES_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "مفتاح JULES_API_KEY مفقود. يرجى إضافته في إعدادات الأسرار." },
        { status: 401 }
      );
    }

    const headers = {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey
    };

    // 1. Get Sources (GitHub Repos)
    if (action === 'get_sources') {
      const res = await fetch(`${JULES_BASE_URL}/sources`, { headers });
      if (!res.ok) throw new Error(`فشل جلب المصادر: ${await res.text()}`);
      return NextResponse.json(await res.json());
    }

    // 2. Create Session
    if (action === 'create_session') {
      const res = await fetch(`${JULES_BASE_URL}/sessions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = errorText;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error?.message || JSON.stringify(errorJson);
        } catch (e) {
          // Keep raw text if not JSON
        }
        throw new Error(`فشل إنشاء الجلسة: ${errorMessage}`);
      }
      return NextResponse.json(await res.json());
    }

    // 3. Get Activities
    if (action === 'get_activities') {
      const { sessionId } = payload;
      // sessionId is expected to be in format "sessions/12345"
      const res = await fetch(`${JULES_BASE_URL}/${sessionId}/activities?pageSize=50`, { headers });
      if (!res.ok) throw new Error(`فشل جلب الأنشطة: ${await res.text()}`);
      return NextResponse.json(await res.json());
    }

    // 4. Send Message (For Auto-Debug and Follow-ups)
    if (action === 'send_message') {
      const { sessionId, prompt } = payload;
      const res = await fetch(`${JULES_BASE_URL}/${sessionId}:sendMessage`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ prompt })
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`فشل إرسال الرسالة: ${errorText}`);
      }
      return NextResponse.json(await res.json());
    }

    return NextResponse.json({ error: "إجراء غير صالح" }, { status: 400 });

  } catch (error: any) {
    console.error("Jules API Error:", error);
    return NextResponse.json(
      { error: error.message || "حدث خطأ داخلي" },
      { status: 500 }
    );
  }
}
