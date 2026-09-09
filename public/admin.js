const labels = {
  supervision: "Supervisión periódica",
  reemplazo: "Reemplazo ante ausencias",
  comunicacion: "Información oportuna",
  puntosCriticos: "Puntos críticos identificados",
  respuestaTerreno: "Respuesta en terreno"
};
let password = sessionStorage.getItem("centinel-admin") || "";
let leads = [];
let filter = "todos";

const loginCard = document.querySelector("#login-card");
const dashboard = document.querySelector("#dashboard");
const loginForm = document.querySelector("#login-form");
const status = loginForm.querySelector(".status");

async function request(method = "GET") {
  const response = await fetch("/api/leads", { method, headers: { "x-admin-password": password } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "No se pudo completar la acción.");
  return data;
}

const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#039;",'"':"&quot;"}[char]));
const date = (iso) => new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

function render() {
  const evaluations = leads.filter((lead) => lead.type === "evaluacion");
  const visits = leads.filter((lead) => lead.type === "visita");
  document.querySelector("#total").textContent = leads.length;
  document.querySelector("#evaluaciones").textContent = evaluations.length;
  document.querySelector("#visitas").textContent = visits.length;
  document.querySelector("#promedio").textContent = evaluations.length ? (evaluations.reduce((sum, lead) => sum + lead.alertas, 0) / evaluations.length).toFixed(1) : "—";
  const visible = filter === "todos" ? leads : leads.filter((lead) => lead.type === filter);
  document.querySelector("#empty").hidden = visible.length !== 0;
  document.querySelector("#lead-list").innerHTML = visible.map((lead, index) => {
    const answers = Object.entries(lead.respuestas || {}).map(([key, value]) => `<span class="${value}">${escapeHtml(labels[key] || key)}<b>${value}</b></span>`).join("");
    return `<article class="lead-card"><button class="lead-summary" aria-expanded="false" aria-controls="detail-${index}"><span class="lead-type">${lead.type === "visita" ? "Visita" : "Evaluación"}</span><span><strong>${escapeHtml(`${lead.nombre} ${lead.apellido || ""}`)}</strong><small>${escapeHtml(lead.cargo || "Sin cargo")}</small></span><span><strong>${escapeHtml(lead.empresa)}</strong><small>${escapeHtml(lead.email)}</small></span><span><strong>${lead.type === "evaluacion" ? `${lead.alertas} alertas` : escapeHtml(lead.fechaPreferida || "Sin fecha")}</strong><small>${date(lead.createdAt)}</small></span><span class="chevron">⌄</span></button><div class="lead-detail" id="detail-${index}" hidden><div class="detail-grid"><div><small>Teléfono</small>${escapeHtml(lead.telefono || "—")}</div><div><small>Instalación / comuna</small>${escapeHtml([lead.tipoInstalacion,lead.comuna].filter(Boolean).join(" · ") || "—")}</div><div><small>Necesidad</small>${escapeHtml(lead.necesidad || "—")}</div></div>${answers ? `<div class="answers">${answers}</div>` : ""}</div></article>`;
  }).join("");
  document.querySelectorAll(".lead-summary").forEach((button) => button.addEventListener("click", () => {
    const detail = document.querySelector(`#${button.getAttribute("aria-controls")}`);
    detail.hidden = !detail.hidden;
    button.setAttribute("aria-expanded", String(!detail.hidden));
  }));
}

async function load() {
  const data = await request();
  leads = data.leads;
  loginCard.hidden = true;
  dashboard.hidden = false;
  document.querySelector("#logout").hidden = false;
  render();
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  password = new FormData(loginForm).get("password");
  status.textContent = "Ingresando…";
  try { await load(); sessionStorage.setItem("centinel-admin", password); status.textContent = ""; }
  catch (error) { password = ""; status.textContent = error.message; }
});

document.querySelectorAll(".filter").forEach((button) => button.addEventListener("click", () => {
  filter = button.dataset.filter;
  document.querySelectorAll(".filter").forEach((item) => item.classList.toggle("active", item === button));
  render();
}));

document.querySelector("#logout").addEventListener("click", () => { sessionStorage.removeItem("centinel-admin"); location.reload(); });
const dialog = document.querySelector("#confirm-dialog");
document.querySelector("#reset").addEventListener("click", () => dialog.showModal());
document.querySelector("#cancel-reset").addEventListener("click", () => dialog.close());
document.querySelector("#confirm-reset").addEventListener("click", async () => {
  const button = document.querySelector("#confirm-reset"); button.disabled = true;
  try { await request("DELETE"); leads = []; dialog.close(); render(); }
  catch (error) { alert(error.message); }
  finally { button.disabled = false; }
});

if (password) load().catch(() => { sessionStorage.removeItem("centinel-admin"); password = ""; });
