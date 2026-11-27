import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin",
};

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

/**
 * Supabase verifies the JWT signature before this function runs because
 * verify_jwt is enabled on deployment. We read the verified token's subject
 * only to confirm that this request belongs to an authenticated user.
 */
function getVerifiedUserId(authorization: string | null): string | null {
  if (!authorization?.startsWith("Bearer ")) return null;

  const token = authorization.slice(7).trim();
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const payloadPart = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payloadPart.padEnd(Math.ceil(payloadPart.length / 4) * 4, "=");
    const payload = JSON.parse(atob(padded));
    return typeof payload.sub === "string" && payload.sub.length > 0
      ? payload.sub
      : null;
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  try {
    // The Supabase Edge gateway validates the JWT (verify_jwt: true).
    const userId = getVerifiedUserId(req.headers.get("Authorization"));
    if (!userId) {
      return jsonResponse({ error: "Your session is missing or invalid. Please sign in again." }, 401);
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "The request body must be valid JSON." }, 400);
    }

    const message =
      body && typeof body === "object" && "message" in body &&
      typeof (body as { message?: unknown }).message === "string"
        ? (body as { message: string }).message.trim()
        : "";

    if (!message) {
      return jsonResponse({ error: "Please enter a message before sending." }, 400);
    }

    if (message.length > 8000) {
      return jsonResponse({ error: "Messages must be 8,000 characters or fewer." }, 400);
    }

    // Free-first Demo Mode: no model provider is called and no API key is required.
    // This deliberately returns a successful response while clearly identifying
    // that the reply is a delivery/test response, not genuine AI reasoning.
    const answer =
      "MICKORYN Demo Mode received your message successfully. " +
      "Your authenticated chat connection is working, but a language model is not " +
      "connected yet, so this reply does not contain AI-generated reasoning. " +
      "Your message: " + message;

    console.info("assistant-chat demo response", {
      assistant: "mickoryn",
      provider: "demo",
      user_id: userId,
      message_length: message.length,
    });

    return jsonResponse({
      answer,
      assistant: "mickoryn",
      provider: "demo",
      simulated: true,
      mode: "demo",
    });
  } catch (error) {
    // Keep internal details in server logs; do not expose secrets to the browser.
    console.error("assistant-chat unexpected error", error);
    return jsonResponse({ error: "MICKORYN could not process this request. Please try again." }, 500);
  }
});
