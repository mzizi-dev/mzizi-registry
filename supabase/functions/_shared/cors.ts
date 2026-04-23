// Shared CORS helpers for every Nyuchi Design Portal edge function.
//
// The portal is public by design — all endpoints serve `Access-Control-Allow-Origin: *`.
// Only the methods differ per function, which is why this file exports a small
// helper rather than a frozen header object.

export function corsHeaders(methods = "GET, POST, OPTIONS"): Headers {
  return new Headers({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Max-Age": "86400",
  })
}

// Every handler should respond to OPTIONS preflight with a 204.
export function preflight(methods = "GET, POST, OPTIONS"): Response {
  return new Response(null, { status: 204, headers: corsHeaders(methods) })
}

// JSON reply with CORS.
export function json(
  body: unknown,
  init: { status?: number; methods?: string } = {}
): Response {
  const headers = corsHeaders(init.methods)
  headers.set("Content-Type", "application/json; charset=utf-8")
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers,
  })
}
