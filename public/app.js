const apiUrl = "/api/leads";
const config = window.CENTINEL_CONFIG || {};

const navToggle = document.querySelector(".nav-toggle");
const nav = document.querySelector("#main-nav");
navToggle?.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(open));
});
nav?.addEventListener("click", () => {
  nav.classList.remove("open");
  navToggle?.setAttribute("aria-expanded", "false");
});

document.querySelector("#ebook-link").href = config.ebookUrl || "#ebook-pendiente";
document.querySelector("#guide-link").href = config.visitGuideUrl || "#guia-pendiente";

function objectFromForm(form) {
  return Object.fromEntries(new FormData(form).entries());
}

async function submitLead(payload) {
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "No pudimos guardar tus datos.");
  return data;
}

const evaluationForm = document.querySelector("#evaluacion");
evaluationForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const status = evaluationForm.querySelector(".form-status");
  const button = evaluationForm.querySelector("button[type=submit]");
  if (!evaluationForm.reportValidity()) return;
  const raw = objectFromForm(evaluationForm);
  const payload = {
    type: "evaluacion",
    nombre: raw.nombre,
    apellido: raw.apellido,
    empresa: raw.empresa,
    cargo: raw.cargo,
    email: raw.email,
    telefono: raw.telefono,
    necesidad: raw.necesidad,
    website: raw.website,
    respuestas: {
      supervision: raw.supervision,
      reemplazo: raw.reemplazo,
      comunicacion: raw.comunicacion,
      puntosCriticos: raw.puntosCriticos,
      respuestaTerreno: raw.respuestaTerreno
    }
  };

  button.disabled = true;
  status.className = "form-status";
  status.textContent = "Guardando tu evaluación…";
  try {
    const data = await submitLead(payload);
    const count = data.alertas;
    document.querySelector("#alert-count").textContent = count;
    const title = document.querySelector("#result-title");
    const copy = document.querySelector("#result-copy");
    if (count <= 1) {
      title.textContent = "Tu servicio muestra una base sólida.";
      copy.textContent = "Aun así, conviene revisar periódicamente que los protocolos y responsables sigan funcionando.";
    } else if (count <= 3) {
      title.textContent = "Hay brechas que conviene revisar.";
      copy.textContent = "Varias respuestas indican que la continuidad del servicio podría depender demasiado de reacciones individuales.";
    } else {
      title.textContent = "Tu operación presenta señales importantes de alerta.";
      copy.textContent = "La falta de supervisión, comunicación o respuesta puede estar trasladando la gestión del proveedor de vuelta a tu equipo.";
    }
    const result = document.querySelector("#resultado");
    result.hidden = false;
    status.textContent = "Evaluación guardada correctamente.";
    result.scrollIntoView({ behavior: "smooth", block: "center" });
  } catch (error) {
    status.className = "form-status error";
    status.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

const visitForm = document.querySelector("#visita");
visitForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const status = visitForm.querySelector(".form-status");
  const button = visitForm.querySelector("button[type=submit]");
  if (!visitForm.reportValidity()) return;
  const raw = objectFromForm(visitForm);
  button.disabled = true;
  status.className = "form-status";
  status.textContent = "Enviando solicitud…";
  try {
    await submitLead({ type: "visita", ...raw });
    status.textContent = "¡Solicitud recibida! Ya puedes descargar la guía para preparar tu visita.";
    document.querySelector("#deleite").scrollIntoView({ behavior: "smooth" });
    visitForm.reset();
  } catch (error) {
    status.className = "form-status error";
    status.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

document.querySelectorAll("a[href^='#ebook-pendiente'],a[href^='#guia-pendiente']").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    alert("Este enlace quedará activo cuando agreguemos el archivo de Drive.");
  });
});
