# 🔴 Plataforma de Votación con Emojis — BNI

Aplicación de votación en tiempo real para sesiones de BNI. Los participantes votan con emojis desde su celular o computadora; el admin ve las barras de resultados actualizarse al instante.

---

## ✨ Características

- **Sin login para participantes** — solo escriben su nombre para entrar
- **Votación en tiempo real** con Socket.io (WebSockets)
- **Panel de admin protegido con PIN** — múltiples admins pueden conectarse simultáneamente
- **Sets de emojis personalizables** — crea, edita y elimina conjuntos de emojis con sus significados
- **Barras de resultados en vivo** con nombres de quién votó qué
- **Diseño BNI** — colores rojo/blanco, tipografía Montserrat
- **Instrucciones integradas** para admins nuevos

---

## 🏗️ Arquitectura

```
plataforma emoticons/
├── server.js              # Servidor principal (Express + Socket.io)
├── package.json           # Dependencias Node.js
├── Dockerfile             # Imagen Docker para DigitalOcean App Platform
├── .dockerignore
├── .do/
│   └── app.yaml           # Config de DigitalOcean App Platform
├── ecosystem.config.cjs   # Config PM2 (para Droplet)
├── deploy/
│   ├── nginx.conf         # Config Nginx con proxy WebSocket
│   └── setup-droplet.sh   # Script de setup para Droplet
└── public/
    ├── index.html         # Interfaz de participantes
    ├── admin.html         # Panel de administración
    ├── css/
    │   └── style.css      # Estilos globales (tema BNI)
    └── js/
        ├── client.js      # Lógica del participante
        └── admin.js       # Lógica del panel admin
```

---

## 🔧 Stack técnico

| Capa | Tecnología |
|---|---|
| Servidor | Node.js + Express |
| Tiempo real | Socket.io (WebSockets) |
| Frontend | HTML + CSS + JS vanilla |
| Tipografía | Montserrat (Google Fonts) |
| Despliegue | DigitalOcean App Platform (Docker) |
| DNS / SSL | Cloudflare |

---

## ⚙️ Variables de entorno

| Variable | Descripción | Default |
|---|---|---|
| `PORT` | Puerto del servidor | `3000` |
| `ADMIN_PIN` | PIN de acceso al panel admin | `emoti2026` |
| `NODE_ENV` | Entorno (`production` / `development`) | — |

Configúralas en **DigitalOcean → App → Settings → Environment Variables**.

---

## 🚀 Correr en local

```bash
npm install
node server.js
```

Abre `http://localhost:3000` para participantes y `http://localhost:3000/admin` para el panel admin.

---

## 🌐 Despliegue en producción

El proyecto está conectado a **DigitalOcean App Platform** via GitHub.  
Cada push a `main` dispara un redeploy automático.

- URL participantes: `https://emoti.bniizcalli.com`
- URL admin: `https://emoti.bniizcalli.com/admin`
- Repositorio: `https://github.com/Seciecito/bni-emoticones`

### DNS (Cloudflare)
- Tipo: `CNAME`
- Nombre: `emoti`
- Contenido: URL de la app en DigitalOcean
- Proxy: **DNS only** (nube gris, NO naranja)

---

## 📋 Flujo de uso en sesión BNI

1. **Admin** entra a `/admin` y se autentica con el PIN
2. **Admin** va a "Sets de emojis" y crea/elige los botones de respuesta
3. **Admin** escribe la pregunta en la pestaña "Pregunta", elige el set y pulsa **Publicar**
4. **Participantes** entran a la URL raíz, escriben su nombre y votan
5. **Admin** ve los resultados en tiempo real con barras por emoji
6. **Admin** puede cerrar/reabrir la votación, reiniciar votos o publicar una nueva pregunta

---

## 🗄️ Persistencia de sets de emojis

Los sets se guardan en `presets.json` en el servidor (archivo excluido de git con `.gitignore`).  
**Importante:** DigitalOcean App Platform usa contenedores efímeros — los sets se pierden si el contenedor se reinicia (p.ej. en un nuevo deploy). Se recomienda recrear los sets antes de cada sesión importante, o migrar a una base de datos si se requiere persistencia total.

---

## 🔌 Eventos Socket.io

### Cliente → Servidor
| Evento | Payload | Descripción |
|---|---|---|
| `join` | `{ name }` | Participante entra a la sala |
| `vote` | `{ emoticonId }` | Participante vota |
| `admin:auth` | `{ pin }` | Admin se autentica |
| `admin:set-question` | `{ text, emoticons, presetId }` | Publica pregunta |
| `admin:toggle` | — | Abre/cierra votación |
| `admin:reset-votes` | — | Reinicia votos |
| `admin:clear-question` | — | Quita pregunta activa |
| `admin:save-preset` | `{ id, data }` | Guarda set de emojis |
| `admin:delete-preset` | `{ id }` | Elimina set |
| `admin:new-preset` | — | Crea nuevo set vacío |

### Servidor → Cliente
| Evento | Payload | Descripción |
|---|---|---|
| `state` | Estado completo | Actualización general (votos, pregunta, participantes) |
| `vote-pulse` | `{ name, emoji }` | Notificación de voto individual |
| `admin:auth-result` | `{ ok, presets }` | Resultado de autenticación |
| `admin:presets-updated` | `{ ok, presets }` | Sets actualizados (broadcast a todos los admins) |
| `error-msg` | `string` | Mensaje de error |
