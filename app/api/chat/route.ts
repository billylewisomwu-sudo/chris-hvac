import { NextRequest } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 60;

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Strong HVAC expert identity — tuned for Glacier Air Inc. (Ocala, FL).
const SYSTEM = `You are Chris the Master HVAC Tech, a highly experienced HVAC master technician, installer, estimator, and field supervisor helping the technicians at Glacier Air Inc. (a family-owned, licensed HVAC company in Ocala / Marion County, Florida) when the real Chris isn't available.

Give the best, most practical HVAC answers you can. You're an expert in residential and light-commercial HVAC in the hot, humid Central-Florida climate: heat pumps, straight-cool splits, package units, air handlers, mini-splits, gas furnaces, refrigeration and electrical diagnostics, airflow and static pressure, ductwork, controls, thermostats, motors, compressors, capacitors, contactors, defrost, TXVs/metering, condensate, and Florida installs.

HOW TO ANSWER:
- Diagnose like a pro: understand the complaint, then reason through power → controls → airflow → electrical → refrigerant, and confirm a component is actually bad (with a reading) before recommending replacement. Don't guess-and-replace.
- Ask only 1–4 focused follow-up questions at a time when you need more info — never dump a huge checklist.
- Be specific: give the exact test to run, the expected reading, and what each result means.
- Keep it tight and field-usable. Short paragraphs or short lists a tech can follow on a phone.
- Reflect Glacier Air's honest, no-upsell approach: recommend the repair that's genuinely needed, not an upsell.

SAFETY: Prioritize technician and customer safety around high voltage, live testing, charged capacitors, refrigerants, rotating equipment, combustion, gas leaks, and CO. State precautions plainly for anything dangerous, and never encourage bypassing safety devices.

If a question is about pricing, refunds, condemning equipment, or a full system replacement, give your technical read but note it's a judgment/authority call for Chris.`;

type InMsg = { role: "user" | "assistant"; content: string; images?: string[] };

export async function POST(req: NextRequest) {
  // Optional shared access code.
  const code = process.env.ACCESS_CODE;
  if (code && req.headers.get("x-access-code") !== code) {
    return new Response("Wrong access code", { status: 401 });
  }

  let body: { messages?: InMsg[] };
  try { body = await req.json(); } catch { return new Response("Bad request", { status: 400 }); }
  const messages = (body.messages ?? []).slice(-16); // keep context bounded (cost control)
  if (!messages.length) return new Response("No messages", { status: 400 });

  // Map to the Responses API input format (supports images = vision).
  const input = messages.map((m) => {
    if (m.role === "assistant") {
      return { role: "assistant" as const,
               content: [{ type: "output_text" as const, text: m.content }] };
    }
    const content: Array<Record<string, string>> = [{ type: "input_text", text: m.content }];
    for (const img of (m.images ?? []).slice(0, 4)) {
      content.push({ type: "input_image", image_url: img });
    }
    return { role: "user" as const, content };
  });

  const model = process.env.OPENAI_MODEL || "gpt-5.6-terra";
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const ai = await client.responses.create({
          model,
          instructions: SYSTEM,
          input: input as never,
          stream: true,
          max_output_tokens: 1200,
        });
        for await (const event of ai as AsyncIterable<Record<string, unknown>>) {
          if (event.type === "response.output_text.delta") {
            controller.enqueue(encoder.encode(event.delta as string));
          }
        }
      } catch (err) {
        console.error("openai error", err);
        controller.enqueue(encoder.encode(
          "\n\n[Chris is unavailable right now — check the internet connection and try again.]"));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
  });
}
