/**
 * EX GLOBAL AI Agent Worker — Cloudflare Worker
 * ===============================================
 * n8n-style AI agent workflow:
 *   Webhook → AI Agent (Claude + Tools) → Output Parser → Switch Router → HTTP Execute → Return
 *
 * SETUP GUIDE:
 * ============
 * 1. Go to https://dash.cloudflare.com → Workers & Pages → Create Worker
 * 2. Paste this entire file → Save & Deploy
 * 3. Go to Worker Settings → Variables → Add these secrets:
 *
 *    ANTHROPIC_API_KEY   — from console.anthropic.com
 *    STORE_API_BASE_URL  — base URL of the target API (e.g. https://api.example.com)
 *    STORE_API_TOKEN     — Bearer token for API authentication
 *    AGENT_SECRET        — any random string to protect /agent endpoint
 *
 * 4. Copy the Worker URL and paste in Admin Panel → Settings → AI Agent → Save
 *
 * ROUTES:
 * =======
 *   POST /agent   — Main AI agent endpoint (requires Authorization: Bearer AGENT_SECRET)
 *   GET  /health  — Health check
 *
 * REQUEST FORMAT:
 * ===============
 *   POST /agent
 *   Authorization: Bearer <AGENT_SECRET>
 *   Content-Type: application/json
 *
 *   { "instruction": "show me all products under SAR 200" }
 *
 * RESPONSE FORMAT:
 * ================
 *   {
 *     "explanation": "Fetching all products and filtering by price...",
 *     "action": { "method": "GET", "url": "...", "body": null },
 *     "result": { ...API response data... }
 *   }
 */

/* ─────────────────────────────────────────────────────────────────
   HELPERS
─────────────────────────────────────────────────────────────────── */

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), { status, headers: corsHeaders() });
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

/* ─────────────────────────────────────────────────────────────────
   TOOL DEFINITIONS (like n8n Tools Agent sub-nodes)
─────────────────────────────────────────────────────────────────── */

const TOOLS = [
  {
    name: 'get_store_docs',
    description: 'Returns the store API documentation. Use this first to understand available endpoints, parameters, and data formats before deciding what API call to make.',
    input_schema: {
      type: 'object',
      properties: {
        section: {
          type: 'string',
          enum: ['products', 'orders', 'customers', 'inventory', 'overview'],
          description: 'Which section of the API docs to retrieve',
        },
      },
      required: ['section'],
    },
  },
  {
    name: 'get_product_catalog',
    description: 'Returns a summary of current product categories and price ranges in the store. Use to understand what products exist before constructing a query.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_order_info',
    description: 'Returns information about order data structure and available order statuses. Use when the instruction is about orders.',
    input_schema: {
      type: 'object',
      properties: {
        order_id: {
          type: 'string',
          description: 'Optional specific order ID to look up. Leave empty for general order schema info.',
        },
      },
      required: [],
    },
  },
];

/* ─────────────────────────────────────────────────────────────────
   TOOL EXECUTION  (returns data Claude uses as tool_result)
─────────────────────────────────────────────────────────────────── */

const API_DOCS = {
  overview: `EX GLOBAL Store REST API — Overview
Base URL: configured via STORE_API_BASE_URL environment variable.
Authentication: Bearer token in Authorization header.

Available endpoints:
  GET    /api/products              — list all products (query: ?category=&minPrice=&maxPrice=&search=)
  GET    /api/products/:id          — get single product
  POST   /api/products              — create product (body: name, price, category, stock, description)
  PUT    /api/products/:id          — update product
  DELETE /api/products/:id          — delete product

  GET    /api/orders                — list orders (query: ?status=&customerId=&from=&to=)
  GET    /api/orders/:id            — get single order
  POST   /api/orders                — create order
  PUT    /api/orders/:id/status     — update order status (body: { status })
  DELETE /api/orders/:id            — cancel order

  GET    /api/customers             — list customers
  GET    /api/customers/:id         — get customer
  DELETE /api/customers/:id         — delete customer

  GET    /api/inventory             — check inventory levels
  PUT    /api/inventory/:productId  — set inventory (body: { stock })`,

  products: `Products API:
  GET /api/products               — list all (optional filters: category, minPrice, maxPrice, search, sort, limit)
  GET /api/products/:id           — single product
  POST /api/products              — create (required: name, price; optional: category, stock, description, imageUrl, colors, sizes)
  PUT /api/products/:id           — partial update
  DELETE /api/products/:id        — remove product

Response shape: { id, name, price, category, stock, rating, sold, createdAt }`,

  orders: `Orders API:
  GET /api/orders                 — list (filters: status, customerId, from, to, limit)
    Status values: pending, confirmed, shipped, delivered, cancelled
  GET /api/orders/:id             — single order
  POST /api/orders                — create (required: customerId, items[{productId,qty}], address)
  PUT /api/orders/:id/status      — update status (body: { status })
  DELETE /api/orders/:id          — cancel

Response shape: { id, customerId, items, total, status, createdAt, trackingNumber }`,

  customers: `Customers API:
  GET /api/customers              — list all (filter: search, limit)
  GET /api/customers/:id          — single customer with order history
  DELETE /api/customers/:id       — remove customer

Response shape: { id, name, email, phone, ordersCount, totalSpent }`,

  inventory: `Inventory API:
  GET /api/inventory              — all product stock levels
  PUT /api/inventory/:productId   — set stock (body: { stock: number })

Response shape: { productId, name, stock, lastUpdated }`,
};

function executeToolCall(toolName, toolInput, env) {
  switch (toolName) {
    case 'get_store_docs': {
      const section = toolInput.section || 'overview';
      return API_DOCS[section] || API_DOCS.overview;
    }
    case 'get_product_catalog': {
      return `EX GLOBAL Product Catalog Summary:
Categories: Women, Men, Kids, Beauty, Shoes, Pet
Price range: SAR 15 – SAR 850
Total products: ~60 active listings
Top sellers: Women's Dresses, Men's Shirts, Kids' Cartoon Tees
Currency: SAR (Saudi Riyal)
Stock: tracked per product/variant`;
    }
    case 'get_order_info': {
      if (toolInput.order_id) {
        return `To fetch order ${toolInput.order_id}: GET /api/orders/${toolInput.order_id}
Returns: { id, customerId, items, total, status, address, trackingNumber, createdAt }`;
      }
      return `Order statuses: pending → confirmed → shipped → delivered (or cancelled)
Order ID format: ORD{timestamp}{random4}
Typical order object: { id, customerId, customerName, items:[{productId,name,qty,price}], total, status, address, trackingNumber, createdAt }`;
    }
    default:
      return 'Unknown tool';
  }
}

/* ─────────────────────────────────────────────────────────────────
   AI AGENT  (node: AI Agent / Tools Agent)
─────────────────────────────────────────────────────────────────── */

const AGENT_SYSTEM_PROMPT = `You are an AI store management agent for EX GLOBAL, a Saudi Arabian fashion e-commerce store.

Your job is to convert a natural-language instruction into a single API action.

WORKFLOW:
1. Use get_store_docs to understand the API if needed.
2. Use get_product_catalog or get_order_info for additional context if needed.
3. Once you have enough information, produce a final structured response in this EXACT JSON format:

{
  "method": "GET" | "POST" | "PUT" | "DELETE",
  "endpoint": "/api/...",
  "body": null | { ...request body object... },
  "explanation": "Brief explanation of what this action does"
}

RULES:
- Only output the JSON block in your final message (after tool calls are done). No extra text.
- endpoint must start with /api/
- Use null for body on GET/DELETE requests.
- Choose the most specific endpoint. For example: to delete product with id 42, use DELETE /api/products/42.
- For listing with filters, add query params to endpoint: e.g. /api/products?category=Women&maxPrice=200
- Always use SAR amounts for prices.`;

async function runAgentLoop(instruction, env) {
  const messages = [{ role: 'user', content: instruction }];
  const MAX_TURNS = 6;

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const resp = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: AGENT_SYSTEM_PROMPT,
        tools: TOOLS,
        messages,
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`Claude API error ${resp.status}: ${err}`);
    }

    const data = await resp.json();
    const stopReason = data.stop_reason;
    const content = data.content || [];

    messages.push({ role: 'assistant', content });

    if (stopReason === 'end_turn') {
      // Extract text block — should contain the final JSON
      const textBlock = content.find(b => b.type === 'text');
      return textBlock ? textBlock.text : '';
    }

    if (stopReason === 'tool_use') {
      // Execute all tool calls and feed results back
      const toolResults = [];
      for (const block of content) {
        if (block.type === 'tool_use') {
          const result = executeToolCall(block.name, block.input || {}, env);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: result,
          });
        }
      }
      messages.push({ role: 'user', content: toolResults });
      continue;
    }

    // Unexpected stop reason
    break;
  }

  throw new Error('Agent did not produce a final response within the allowed turns.');
}

/* ─────────────────────────────────────────────────────────────────
   STRUCTURED OUTPUT PARSER  (node: Auto-fixing Output Parser)
   Parses Claude's text output into { method, endpoint, body, explanation }
   Retries up to 2 times with a correction prompt if parsing fails.
─────────────────────────────────────────────────────────────────── */

function extractJson(text) {
  // Try direct parse first
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch (_) {}

  // Extract first JSON block from markdown or surrounding text
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch (_) {}
  }
  return null;
}

function validateParsed(obj) {
  if (!obj || typeof obj !== 'object') return false;
  if (!['GET', 'POST', 'PUT', 'DELETE'].includes(obj.method)) return false;
  if (typeof obj.endpoint !== 'string' || !obj.endpoint.startsWith('/api/')) return false;
  return true;
}

async function parseWithRetry(agentText, env) {
  let parsed = extractJson(agentText);
  if (parsed && validateParsed(parsed)) return parsed;

  // Auto-fix: ask Claude to correct the output (like n8n Auto-fixing Output Parser)
  const fixPrompt = `The following text should be a JSON object with keys: method, endpoint, body, explanation.
It is malformed or missing required fields. Fix it and return ONLY the corrected JSON, nothing else.

Text to fix:
${agentText}

Required format:
{
  "method": "GET" | "POST" | "PUT" | "DELETE",
  "endpoint": "/api/...",
  "body": null or {...},
  "explanation": "string"
}`;

  for (let attempt = 0; attempt < 2; attempt++) {
    const resp = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [{ role: 'user', content: fixPrompt }],
      }),
    });

    if (resp.ok) {
      const data = await resp.json();
      const text = (data.content || []).find(b => b.type === 'text')?.text || '';
      parsed = extractJson(text);
      if (parsed && validateParsed(parsed)) return parsed;
    }
  }

  throw new Error(`Output parser failed to produce valid JSON after retries. Raw output:\n${agentText}`);
}

/* ─────────────────────────────────────────────────────────────────
   SWITCH ROUTER + HTTP EXECUTOR
   (nodes: Switch → Get properties / Post URL / Delete URL → Return output)
─────────────────────────────────────────────────────────────────── */

async function executeAction(parsed, env) {
  const baseUrl = (env.STORE_API_BASE_URL || '').replace(/\/$/, '');
  const url = baseUrl + parsed.endpoint;
  const headers = {
    'Content-Type': 'application/json',
    ...(env.STORE_API_TOKEN ? { 'Authorization': `Bearer ${env.STORE_API_TOKEN}` } : {}),
  };

  let fetchOptions;

  // Switch (mode: Rules) — route by HTTP method
  switch (parsed.method) {
    case 'GET':
      fetchOptions = { method: 'GET', headers };
      break;

    case 'POST':
      fetchOptions = {
        method: 'POST',
        headers,
        body: parsed.body ? JSON.stringify(parsed.body) : '{}',
      };
      break;

    case 'PUT':
      fetchOptions = {
        method: 'PUT',
        headers,
        body: parsed.body ? JSON.stringify(parsed.body) : '{}',
      };
      break;

    case 'DELETE':
      fetchOptions = { method: 'DELETE', headers };
      break;

    default:
      throw new Error(`Unknown method: ${parsed.method}`);
  }

  const res = await fetchWithTimeout(url, fetchOptions);
  let resultData;
  try {
    resultData = await res.json();
  } catch (_) {
    resultData = { status: res.status, statusText: res.statusText };
  }

  return {
    httpStatus: res.status,
    ok: res.ok,
    data: resultData,
  };
}

/* ─────────────────────────────────────────────────────────────────
   MAIN WORKER ENTRY (Webhook node)
─────────────────────────────────────────────────────────────────── */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    // Health check
    if (url.pathname === '/health' && request.method === 'GET') {
      return json({
        status: 'ok',
        worker: 'EX GLOBAL AI Agent Worker',
        model: 'claude-sonnet-4-6',
        timestamp: new Date().toISOString(),
      });
    }

    // Main agent endpoint
    if (url.pathname === '/agent' && request.method === 'POST') {
      // Auth check
      if (env.AGENT_SECRET) {
        const authHeader = request.headers.get('Authorization') || '';
        const token = authHeader.replace('Bearer ', '').trim();
        if (token !== env.AGENT_SECRET) {
          return json({ error: 'Unauthorized' }, 401);
        }
      }

      if (!env.ANTHROPIC_API_KEY) {
        return json({ error: 'ANTHROPIC_API_KEY not configured' }, 500);
      }

      let instruction;
      try {
        const body = await request.json();
        instruction = (body.instruction || '').trim();
      } catch (_) {
        return json({ error: 'Invalid JSON body' }, 400);
      }

      if (!instruction) {
        return json({ error: 'instruction field is required' }, 400);
      }

      try {
        // Step 1 — AI Agent with Tools
        const agentOutput = await runAgentLoop(instruction, env);

        // Step 2 — Structured Output Parser (auto-fixing)
        const parsed = await parseWithRetry(agentOutput, env);

        // Step 3 — Switch Router + HTTP Executor
        const result = await executeAction(parsed, env);

        // Return structured output
        return json({
          explanation: parsed.explanation,
          action: {
            method: parsed.method,
            url: (env.STORE_API_BASE_URL || '') + parsed.endpoint,
            body: parsed.body || null,
          },
          result,
        });

      } catch (e) {
        return json({ error: e.message }, 500);
      }
    }

    return json({ error: 'Not found' }, 404);
  },
};
