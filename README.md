# Centinel — Landing Flywheel

Landing de una sola página con las etapas de atracción, interacción y deleite. Incluye autodiagnóstico de cinco preguntas, solicitud de visita, persistencia mediante Netlify Blobs y panel privado en `/admin`.

## Publicación

1. Sube esta carpeta a un repositorio de GitHub.
2. En Netlify, selecciona **Add new project → Import an existing project → GitHub** y elige el repositorio.
3. Netlify detectará `netlify.toml`; no requiere comando de compilación y publicará la carpeta `public`.
4. En **Project configuration → Environment variables**, agrega `ADMIN_PASSWORD` con la clave que usarás en `/admin`.
5. Reemplaza los dos enlaces pendientes en `public/assets/config.js` por los enlaces públicos de Drive.

## Desarrollo local

```bash
npm install
npm run dev
```

El panel queda en `http://localhost:8888/admin` y la landing en `http://localhost:8888/`.

## Reiniciar la presentación

Entra a `/admin`, selecciona **Reiniciar demo** y confirma. Esto elimina todos los registros del almacén `centinel-leads`.
