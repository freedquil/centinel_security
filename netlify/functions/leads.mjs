import { getStore } from "@netlify/blobs";
import { timingSafeEqual } from "node:crypto";

const questions = ["supervision", "reemplazo", "comunicacion", "puntosCriticos", "respuestaTerreno"];
const allowedTypes = new Set(["evaluacion", "visita"]);

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
});

const clean = (value, max = 180) => typeof value === "string" ? value.trim().slice(0, max) : "";

function authorized(request) {
  const expected = process.env.ADMIN_PASSWORD || "";
  const received = request.headers.get("x-admin-password") || "";
  const expectedBytes = Buffer.from(expected);
  const receivedBytes = Buffer.from(received);
  if (!expected || expectedBytes.length !== receivedBytes.length) return false;
  return timingSafeEqual(expectedBytes, receivedBytes);
}

function validateSubmission(raw) {
  const type = clean(raw.type, 20);
  if (!allowedTypes.has(type)) throw new Error("Tipo de registro inválido.");

  if (clean(raw.website, 100)) throw new Error("Envío rechazado.");

  const lead = {
    id: crypto.randomUUID(),
    type,
    createdAt: new Date().toISOString(),
    nombre: clean(raw.nombre, 80),
    apellido: clean(raw.apellido, 80),
    empresa: clean(raw.empresa, 120),
    cargo: clean(raw.cargo, 120),
    email: clean(raw.email, 160).toLowerCase(),
    telefono: clean(raw.telefono, 40),
    necesidad: clean(raw.necesidad, 500),
    tipoInstalacion: clean(raw.tipoInstalacion, 100),
    comuna: clean(raw.comuna, 100),
    fechaPreferida: clean(raw.fechaPreferida, 40),
    respuestas: {}
  };

  if (!lead.nombre || !lead.empresa || !lead.email) {
    throw new Error("Completa nombre, empresa y correo.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
    throw new Error("Ingresa un correo válido.");
  }

  if (type === "evaluacion") {
    for (const key of questions) {
      const value = clean(raw.respuestas?.[key], 3);
      if (value !== "si" && value !== "no") throw new Error("Responde las cinco preguntas.");
      lead.respuestas[key] = value;
    }
    lead.alertas = Object.values(lead.respuestas).filter((value) => value === "no").length;
  }

  return lead;
}

async function listLeads(store) {
  const { blobs = [] } = await store.list({ prefix: "lead:" });
  const values = await Promise.all(blobs.map(({ key }) => store.get(key, { type: "json", consistency: "strong" })));
  return values.filter(Boolean).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export default async (request) => {
  const store = getStore({ name: "centinel-leads", consistency: "strong" });

  try {
    if (request.method === "POST") {
      const raw = await request.json();
      const lead = validateSubmission(raw);
      const key = `lead:${lead.createdAt}:${lead.id}`;
      await store.setJSON(key, lead, { onlyIfNew: true });
      return json({ ok: true, id: lead.id, alertas: lead.alertas ?? null }, 201);
    }

    if (request.method === "GET") {
      if (!authorized(request)) return json({ error: "Clave incorrecta." }, 401);
      return json({ leads: await listLeads(store) });
    }

    if (request.method === "DELETE") {
      if (!authorized(request)) return json({ error: "Clave incorrecta." }, 401);
      const { blobs = [] } = await store.list({ prefix: "lead:" });
      await Promise.all(blobs.map(({ key }) => store.delete(key)));
      return json({ ok: true, deleted: blobs.length });
    }

    return json({ error: "Método no permitido." }, 405);
  } catch (error) {
    console.error(error);
    const message = error instanceof SyntaxError ? "No se pudo leer el formulario." : error.message;
    return json({ error: message || "Ocurrió un error al guardar." }, 400);
  }
};

export const config = { path: "/api/leads" };
