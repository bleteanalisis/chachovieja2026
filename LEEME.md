# ChachoVieja 2026 · Web de la fiesta

Tu socio y tú veis y editáis la misma lista. Los cambios del otro aparecen solos en unos segundos. No hay cuentas ni bases de datos que configurar: los datos se guardan en el almacenamiento propio de Netlify (Netlify Blobs).

## Qué hay en la carpeta

- `public/` contiene la web: `index.html` y `logo.png`.
- `netlify/functions/fiesta.mjs` es el pequeño servidor que guarda los datos.
- `package.json` le dice a Netlify qué instalar. Lo instala Netlify, tú no tienes que hacer nada.
- `netlify.toml` contiene los ajustes de Netlify.

## Publicar (solo Netlify y desde GitHub)

1. Sube **toda la carpeta**, con sus subcarpetas, a un repositorio de GitHub.
2. En https://app.netlify.com: **Add new project › Import an existing project › GitHub** y elige el repositorio.
3. No cambies ningún ajuste: `netlify.toml` ya lo dice todo. Pulsa **Deploy**.

No funciona arrastrando la carpeta a Netlify Drop ni en Vercel, porque el servidor de datos necesita el despliegue de Netlify desde GitHub.

## Primer uso

1. Abre tu dirección de Netlify y pulsa **Crear la fiesta**. La dirección pasará a terminar en `#cv-...`: ese es el código de vuestra fiesta.
2. Escribe tu nombre cuando te lo pida.
3. Ve a **Balance › Enlace de la fiesta › Copiar enlace** y pásaselo a tu socio por WhatsApp. Él lo abre y pone su nombre.
4. En **Balance › Ajustes** pon precio, aforo, fecha y lugar.

Guarda el enlace en privado: quien lo tenga puede ver y editar todo.

## Bueno saber

- La app se actualiza sola cada 4 segundos mientras está abierta.
- Si te quedas sin cobertura, tus cambios se guardan en cola y se envían al volver la conexión. No cierres la app mientras pone "Sin conexión".
- En **Balance › Copia de seguridad** puedes descargar una copia. Restaurarla reemplaza todo, también para tu socio.
- Plan gratuito de Netlify: el uso de una fiesta entre dos personas gasta una parte muy pequeña del límite mensual.
