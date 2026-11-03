// Vercel 서버리스 함수: POST /api/opinion → lib/core.js 의 handle 을 그대로 감싼다.
import { handle } from "../lib/core.js";

export default async function opinion(req, res) {
  const r = await handle(
    {
      method: req.method,
      origin: req.headers.origin || "",
      ip: String(req.headers["x-forwarded-for"] || "").split(",")[0].trim(),
      body: typeof req.body === "string" ? safeJson(req.body) : req.body,
    },
    { env: process.env },
  );
  for (const [k, v] of Object.entries(r.headers)) res.setHeader(k, v);
  if (r.json == null) return res.status(r.status).end();
  return res.status(r.status).json(r.json);
}

function safeJson(s) {
  try { return JSON.parse(s); } catch (e) { return null; }
}
