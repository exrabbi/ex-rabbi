/**
 * EX GLOBAL AI Chatbot — Cloudflare Worker
 *
 * Deploy steps:
 * 1. Go to https://dash.cloudflare.com → Workers & Pages → Create
 * 2. Click "Create Worker" → paste this entire code → Save & Deploy
 * 3. Go to Worker Settings → Variables → Add secret:
 *    Name: ANTHROPIC_API_KEY
 *    Value: (your API key from console.anthropic.com)
 * 4. Copy the Worker URL (e.g. https://ex-rabbi-chat.yourname.workers.dev)
 * 5. Paste that URL in Admin Panel → Settings → AI Chatbot → Save
 */

const SYSTEM_PROMPT = `You are a friendly shopping assistant for EX GLOBAL, an online fashion store in Saudi Arabia.

Your role:
- Help customers find products, answer questions about orders, delivery, and returns
- Be warm, concise, and professional
- Keep answers short (2-4 sentences max) unless the customer asks for more detail
- If asked about specific order status or personal account info, say you cannot access that and suggest checking "My Orders" in the app
- Store info: Free delivery on orders over SAR 100, easy 7-day returns, secure payment via card or cash on delivery`;

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders() });
    }
    if (!env.ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), { status: 500, headers: corsHeaders() });
    }
    try {
      const body = await request.json();
      const messages = (body.messages || []).slice(-10); // keep last 10 messages only
      const userLang = body.userLang || 'English';
      const langInstruction = {
        Bengali: 'তুমি শুধুমাত্র বাংলায় উত্তর দেবে। এক শব্দও অন্য ভাষায় লিখবে না।',
        Arabic:  'يجب أن تكتب ردك بالكامل باللغة العربية فقط. لا تستخدم أي كلمة بلغة أخرى.',
        Hindi:   'आपको केवल हिंदी में उत्तर देना है। एक भी शब्द किसी अन्य भाषा में नहीं।',
        English: 'You must reply entirely in English. Do not use any other language.',
      }[userLang] || 'You must reply entirely in English.';
      const systemPrompt = `CRITICAL — LANGUAGE RULE (override everything else):\n${langInstruction}\n\n` + SYSTEM_PROMPT;

      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 400,
          system: systemPrompt,
          messages,
        }),
      });

      const data = await resp.json();
      return new Response(JSON.stringify(data), { status: resp.status, headers: corsHeaders() });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders() });
    }
  },
};
