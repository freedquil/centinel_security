import { readFile, access } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("../", import.meta.url).pathname;
const files = ["public/index.html", "public/admin.html", "public/styles.css", "public/admin.css", "public/app.js", "public/admin.js", "public/assets/config.js", "public/assets/centinel-monitoreo.png", "netlify/functions/leads.mjs", "netlify.toml"];
for (const file of files) await access(join(root, file));
const index = await readFile(join(root, "public/index.html"), "utf8");
for (const id of ["atraccion", "interaccion", "deleite", "evaluacion", "visita"]) {
  if (!index.includes(`id="${id}"`)) throw new Error(`Falta la sección ${id}`);
}
await import(join(root, "netlify/functions/leads.mjs"));
console.log(`OK: ${files.length} archivos y rutas principales validados.`);
