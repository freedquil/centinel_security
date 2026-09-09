import { spawn } from "node:child_process";

const child = spawn("npx", ["netlify", "dev", "--offline"], {
  env: { ...process.env, ADMIN_PASSWORD: "demo-centinel" },
  stdio: ["ignore", "pipe", "pipe"],
  detached: true
});

let output = "";
child.stdout.on("data", (chunk) => { output += chunk; });
child.stderr.on("data", (chunk) => { output += chunk; });

const waitUntilReady = async () => {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch("http://localhost:8888/");
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`El servidor no inició.\n${output}`);
};

const api = async (method, body) => {
  const response = await fetch("http://localhost:8888/api/leads", {
    method,
    headers: { "content-type": "application/json", "x-admin-password": "demo-centinel" },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`${method} falló: ${JSON.stringify(data)}`);
  return data;
};

try {
  await waitUntilReady();
  const admin = await fetch("http://localhost:8888/admin");
  if (!admin.ok) throw new Error("La ruta /admin no responde.");
  await api("DELETE");
  const created = await api("POST", {
    type: "evaluacion", nombre: "Lead", apellido: "Demo", empresa: "Empresa Prueba",
    cargo: "Jefe de Seguridad", email: "lead@empresa.cl", telefono: "+56912345678",
    necesidad: "Falta de supervisión", website: "",
    respuestas: { supervision: "no", reemplazo: "no", comunicacion: "si", puntosCriticos: "no", respuestaTerreno: "si" }
  });
  if (!created.ok || created.alertas !== 3) throw new Error("El diagnóstico no calculó las alertas correctamente.");
  const listed = await api("GET");
  if (listed.leads.length !== 1 || listed.leads[0].email !== "lead@empresa.cl") throw new Error("El lead no apareció en Admin.");
  const reset = await api("DELETE");
  if (!reset.ok) throw new Error("No se pudo reiniciar la demo.");
  const empty = await api("GET");
  if (empty.leads.length !== 0) throw new Error("La demo no quedó vacía.");
  console.log("OK: landing, Admin, guardado, lectura y reinicio funcionan.");
} finally {
  process.kill(-child.pid, "SIGTERM");
}
