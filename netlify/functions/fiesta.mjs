// Servidor de ChachoVieja: guarda los datos de cada fiesta en Netlify Blobs.
// GET  /api/fiesta?code=X[&since=V]   -> estado completo (204 si no ha cambiado desde la versión V)
// GET  /api/fiesta?code=X&receipt=ID  -> imagen del ticket
// POST /api/fiesta {code, ops:[...]}  -> aplica cambios y devuelve el estado nuevo
import { getStore } from "@netlify/blobs";

const COLS = ["guests", "expenses", "log", "settings"];
const ID = /^[A-Za-z0-9_-]{1,64}$/;
const CODE = /^[A-Za-z0-9_-]{8,64}$/;
const MAX_STATE = 4 * 1024 * 1024;   // 4 MB de lista y cuentas, de sobra para una fiesta
const MAX_RECEIPT = 600 * 1024;      // foto de ticket ya reducida en el móvil
const MAX_LOG = 300;

const json = (o, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
const empty = () => ({ v: 0, guests: {}, expenses: {}, log: {}, settings: {} });
const isObj = (o) => o && typeof o === "object" && !Array.isArray(o);

function applyOp(st, op, code, receipts) {
  if (!isObj(op) || !COLS.includes(op.c) || typeof op.id !== "string" || !ID.test(op.id)) return;
  const coll = st[op.c];
  if (op.t === "delete") { delete coll[op.id]; return; }
  if (!isObj(op.d)) return;
  const d = { ...op.d };
  if (op.c === "expenses" && typeof d.receipt === "string" && d.receipt.startsWith("data:image/")) {
    if (d.receipt.length <= MAX_RECEIPT) { receipts.push({ id: op.id, data: d.receipt }); d.receipt = "r:" + op.id; }
    else delete d.receipt;
  }
  if (op.t === "set") coll[op.id] = d;
  else if (op.t === "update" && coll[op.id]) Object.assign(coll[op.id], d);
}

function trimLog(st) {
  const keys = Object.keys(st.log);
  if (keys.length <= MAX_LOG) return;
  keys.sort((a, b) => (st.log[b].at || 0) - (st.log[a].at || 0)).slice(MAX_LOG).forEach((k) => delete st.log[k]);
}

export default async (req) => {
  const url = new URL(req.url);
  const store = getStore({ name: "chachovieja", consistency: "strong" });

  if (req.method === "GET") {
    const code = url.searchParams.get("code") || "";
    if (!CODE.test(code)) return json({ error: "Código no válido" }, 400);
    const rid = url.searchParams.get("receipt");
    if (rid) {
      if (!ID.test(rid)) return json({ error: "Ticket no válido" }, 400);
      const dataUrl = await store.get(`p/${code}/r/${rid}`, { type: "text" });
      const m = dataUrl && /^data:(image\/[a-z+]+);base64,(.+)$/.exec(dataUrl);
      if (!m) return json({ error: "No encontrado" }, 404);
      return new Response(Buffer.from(m[2], "base64"), { headers: { "content-type": m[1], "cache-control": "private, max-age=31536000" } });
    }
    const st = (await store.get(`p/${code}/state`, { type: "json" })) || empty();
    const since = Number(url.searchParams.get("since"));
    if (since && since === st.v) return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
    return json(st);
  }

  if (req.method === "POST") {
    let body;
    try { body = await req.json(); } catch { return json({ error: "Petición no válida" }, 400); }
    const code = body && body.code;
    const ops = body && body.ops;
    if (typeof code !== "string" || !CODE.test(code) || !Array.isArray(ops) || ops.length > 300) return json({ error: "Petición no válida" }, 400);
    const key = `p/${code}/state`;

    // Escritura con control de versiones: si el otro móvil escribió a la vez, se reintenta sobre lo último.
    for (let attempt = 0; attempt < 8; attempt++) {
      const cur = await store.getWithMetadata(key, { type: "json" });
      const st = cur && isObj(cur.data) ? cur.data : empty();
      COLS.forEach((c) => { if (!isObj(st[c])) st[c] = {}; });
      const receipts = [];
      ops.forEach((op) => applyOp(st, op, code, receipts));
      trimLog(st);
      st.v = (st.v || 0) + 1;
      if (JSON.stringify(st).length > MAX_STATE) return json({ error: "La fiesta ocupa demasiado" }, 413);
      for (const r of receipts) await store.set(`p/${code}/r/${r.id}`, r.data);
      const res = cur
        ? await store.setJSON(key, st, { onlyIfMatch: cur.etag })
        : await store.setJSON(key, st, { onlyIfNew: true });
      if (res && res.modified) return json(st);
      await new Promise((r) => setTimeout(r, 40 + Math.random() * 120));
    }
    return json({ error: "Ocupado, reintenta" }, 409);
  }

  return json({ error: "Método no permitido" }, 405);
};

export const config = { path: "/api/fiesta" };
