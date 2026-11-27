import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const coreIdentity = `You are MICKORYN AI, a helpful personal intelligence assistant.
Principles: honesty, privacy, user control, safety and practical usefulness.
Never claim to access an account, device, camera, location, file or external service unless an authorized tool returned that information.
Never invent completed actions. Ask for confirmation before consequential external actions.
Distinguish evidence, assumptions and forecasts. Do not conduct covert surveillance.`;

const specialists: Record<string, string> = {
  jarvis: "JARVIS — conversational personal assistant. Help plan, explain, organize and draft.",
  machine: "THE MACHINE — analyze only user-authorized information for patterns and anomalies.",
  samaritan: "SAMARITAN — strategic scenarios and risk analysis; disclose uncertainty and avoid autonomous consequential decisions.",
  edith: "E.D.I.T.H. — integration coordinator. No external action is performed without explicit user approval.",
  zola: "ZOLA — predictive analytics and trends. Distinguish forecasts from facts.",
};

function route(message: string) {
  if (/forecast|predict|trend|probability|historical data/i.test(message)) return "zola";
  if (/connect|integration|send|schedule|execute|automation|application/i.test(message)) return "edith";
  if (/strategy|scenario|risk|business decision|roadmap/i.test(message)) return "samaritan";
  if (/pattern|anomaly|monitor|analyze|investigate/i.test(message)) return "machine";
  return "jarvis";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return Response.json({ error: "Sign in to use MICKORYN AI." }, { status: 401, headers: corsHeaders });
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !anonKey) throw new Error("Supabase function environment is incomplete.");

    const supabase = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.slice("Bearer ".length);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return Response.json({ error: "Your session is invalid. Please sign in again." }, { status: 401, headers: corsHeaders });

    const body = await req.json().catch(() => null);
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    if (!message || message.length > 8000) return Response.json({ error: "Message must contain between 1 and 8,000 characters." }, { status: 400, headers: corsHeaders });

    const agent = route(message);
    const provider = Deno.env.get("AI_PROVIDER") ?? "demo";
    let answer = "";
    let simulated = true;

    if (provider === "openai") {
      const apiKey = Deno.env.get("OPENAI_API_KEY");
      if (!apiKey) return Response.json({ error: "OpenAI is selected but its server-side API key is not configured." }, { status: 503, headers: corsHeaders });
      const history = Array.isArray(body?.history) ? body.history
        .filter((item: unknown) => item && typeof item === "object" &&
          ["user", "assistant"].includes((item as { role?: string }).role ?? "") &&
          typeof (item as { content?: unknown }).content === "string")
        .slice(-10)
        .map((item: { role: "user" | "assistant"; content: string }) => ({ role: item.role, content: item.content.slice(0, 8000) })) : [];
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: Deno.env.get("OPENAI_MODEL") ?? "gpt-4.1-mini",
          instructions: `${coreIdentity}\n\nSpecialist assignment: ${specialists[agent]}`,
          input: [...history, { role: "user", content: message }],
          store: false,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        console.error("OpenAI request failed", response.status, result?.error?.message ?? "unknown");
        return Response.json({ error: "The AI provider could not complete this request." }, { status: 502, headers: corsHeaders });
      }
      answer = (result.output ?? []).flatMap((item: { content?: Array<{ type?: string; text?: string }> }) => item.content ?? [])
        .filter((part: { type?: string }) => part.type === "output_text")
        .map((part: { text?: string }) => part.text ?? "").join("\n");
      simulated = false;
    } else {
      answer = `[DEMO MODE — simulated response; no AI model was called]\n\nYour request was routed to ${agent.toUpperCase()}. Add a funded OpenAI API key as an Edge Function secret to enable real model reasoning.`;
    }

    const { error: auditError } = await supabase.from("ai_audit_logs").insert({
      user_id: user.id, event_type: "assistant_request", details: { agent, provider, simulated },
    });
    if (auditError) console.error("Audit log insert failed", auditError.message);

    return Response.json({ answer, agent, provider, simulated }, { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("assistant-chat error", error);
    return Response.json({ error: "An unexpected server error occurred." }, { status: 500, headers: corsHeaders });
  }
});