import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.0";

const cors = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "http://localhost:5173",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const identity = `You are MICKORYN AI, a privacy-conscious personal intelligence assistant.
Be truthful about your capabilities. Never claim to access devices, accounts, cameras or external services without an authorized tool result.
Never perform consequential external actions without explicit user approval.
Respect user privacy and distinguish facts, estimates and assumptions.`;

function route(message: string) {
  if (/forecast|predict|trend|probability/i.test(message)) return "zola";
  if (/connect|integration|send|schedule|automation/i.test(message)) return "edith";
  if (/strategy|scenario|risk|roadmap/i.test(message)) return "samaritan";
  if (/pattern|anomaly|monitor|investigate/i.test(message)) return "machine";
  return "jarvis";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405, headers: cors });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return Response.json({ error: "Authentication required" }, { status: 401, headers: cors });

  const supabase = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return Response.json({ error: "Invalid session" }, { status: 401, headers: cors });

  const body = await req.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!message || message.length > 8000) return Response.json({ error: "Message must contain 1–8000 characters" }, { status: 400, headers: cors });

  const agent = route(message);
  const provider = Deno.env.get("AI_PROVIDER") ?? "demo";
  let answer: string;
  let simulated = true;

  if (provider === "openai") {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) return Response.json({ error: "OpenAI provider is selected but OPENAI_API_KEY is not configured" }, { status: 503, headers: cors });
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: Deno.env.get("OPENAI_MODEL") ?? "gpt-4.1-mini",
        instructions: `${identity}\nSpecialist: ${agent}.`,
        input: message,
        store: false,
      }),
    });
    const result = await response.json();
    if (!response.ok) return Response.json({ error: "AI provider request failed", details: result?.error?.message ?? "Unknown provider error" }, { status: 502, headers: cors });
    answer = (result.output ?? []).flatMap((item: any) => item.content ?? []).filter((part: any) => part.type === "output_text").map((part: any) => part.text).join("\n");
    simulated = false;
  } else {
    answer = `[DEMO MODE — simulated response, no AI model was called]\n\nMICKORYN AI received your request and routed it to ${agent.toUpperCase()}. Configure the server-side OpenAI provider to enable real model reasoning.`;
  }

  const { error: logError } = await supabase.from("ai_audit_logs").insert({
    user_id: user.id,
    event_type: "assistant_request",
    details: { agent, provider, simulated },
  });
  if (logError) console.error("Audit log insert failed", logError.message);

  return Response.json({ answer, agent, provider, simulated }, { headers: cors });
});
