// api/realtime-token.js

// Minimal CORS helper
function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
}

export default async function handler(req, res) {
  cors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
  }

  const body = typeof req.body === "object" ? req.body : {};
  const { model = "gpt-4o-realtime", voice = "alloy", instructions } = body;

  const r = await fetch("https://api.openai.com/v1/realtime/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      voice,
      instructions:
        instructions ||
        "You are a calm, professional de-escalation coach persona for frontline training.",
      input_audio_transcription: { model: "whisper-1" },
      turn_detection: { type: "server_vad" },
    }),
  });

  const text = await r.text();
  if (!r.ok) {
    return res.status(r.status).send(text);
  }
  const data = JSON.parse(text);
  return res.status(200).json({ token: data.client_secret?.value, model });
}
