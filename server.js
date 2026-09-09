const express = require("express");
const http = require("http");
const os = require("os");
const fs = require("fs");
const { Server } = require("socket.io");
const path = require("path");

const PORT = process.env.PORT || 3000;
const ADMIN_PIN = process.env.ADMIN_PIN || "emoti2026";
const PRESETS_FILE = path.join(__dirname, "presets.json");

const DEFAULT_PRESETS = [
  {
    id: "referidos",
    name: "Referidos (Givers Gain)",
    hint: "Para preguntas de quién puede abrir una puerta o traer un contacto.",
    emoticons: [
      { id: "fire",   emoji: "🔥", label: "Fuego",    meaning: "Tengo el contacto directo para abrir esa puerta." },
      { id: "clap",   emoji: "👏", label: "Aplausos", meaning: "Conozco a un aliado o proveedor que nos puede acercar estratégicamente." },
      { id: "idea",   emoji: "💡", label: "Foco",     meaning: "Tengo una estrategia, consejo legal o solución operativa para resolverlo." },
      { id: "bridge", emoji: "🤝", label: "Puente",   meaning: "Puedo presentar o facilitar una conexión entre las partes clave." },
      { id: "build",  emoji: "🛠️", label: "Ejecución",meaning: "Tengo recursos, equipo o capacidad para hacerlo realidad." },
    ],
  },
  {
    id: "aprendizaje",
    name: "Aprendizaje de cápsula",
    hint: "Para cerrar una cápsula: qué me llevo y qué necesito.",
    emoticons: [
      { id: "claro",   emoji: "✅", label: "Claro",   meaning: "Lo puedo aplicar esta semana con un cliente." },
      { id: "ejemplo", emoji: "🎯", label: "Ejemplo", meaning: "Necesito un caso real o un 1 a 1 para aterrizarlo." },
      { id: "equipo",  emoji: "🧩", label: "Equipo",  meaning: "Esto le sirve a un aliado de mi Power Team." },
      { id: "invitar", emoji: "👋", label: "Invitar", meaning: "Esto es motivo para volver o invitar a alguien." },
      { id: "duda",    emoji: "❓", label: "Duda",    meaning: "Tengo una objeción o un hueco; quiero preguntar." },
    ],
  },
  {
    id: "compromiso",
    name: "Compromiso / Ask",
    hint: "Para un ask concreto de la semana.",
    emoticons: [
      { id: "yo",       emoji: "🙋", label: "Yo lo hago", meaning: "Puedo cumplir este ask o dar el referido esta semana." },
      { id: "unoauno",  emoji: "☕", label: "1 a 1",      meaning: "Quiero un uno a uno para aterrizar cómo ayudar." },
      { id: "presento", emoji: "📞", label: "Presento",   meaning: "Puedo hacer una introducción puntual." },
      { id: "ahora-no", emoji: "⏳", label: "Ahora no",   meaning: "No aplica para mí en este momento." },
    ],
  },
];

// ── Persistencia de mazos ──────────────────────────────────────────────────
function loadPresets() {
  try {
    if (fs.existsSync(PRESETS_FILE)) {
      const data = JSON.parse(fs.readFileSync(PRESETS_FILE, "utf8"));
      if (Array.isArray(data) && data.length >= 1) return data;
    }
  } catch (_) {}
  return DEFAULT_PRESETS.map((p) => ({ ...p }));
}

function savePresets(list) {
  try { fs.writeFileSync(PRESETS_FILE, JSON.stringify(list, null, 2), "utf8"); } catch (_) {}
}

let PRESETS = loadPresets();

// ── Validación de mazos ───────────────────────────────────────────────────
const segmenter = new Intl.Segmenter("es", { granularity: "grapheme" });

function takeEmojis(value, max = 2) {
  return [...segmenter.segment(String(value || "").trim())]
    .slice(0, max)
    .map((p) => p.segment)
    .join("");
}

function sanitizeEmoticons(list) {
  if (!Array.isArray(list)) return null;
  const cleaned = [];
  for (const item of list) {
    if (cleaned.length >= 6) break;
    const emoji   = takeEmojis(item && item.emoji, 2);
    const label   = String((item && item.label)   || "").trim().slice(0, 24);
    const meaning = String((item && item.meaning) || "").trim().slice(0, 180);
    if (!emoji || label.length < 2 || meaning.length < 8) continue;
    cleaned.push({ id: `opt-${cleaned.length}`, emoji, label, meaning });
  }
  if (cleaned.length < 2) return null;
  return cleaned;
}

function sanitizePreset(raw) {
  const name = String((raw && raw.name) || "").trim().slice(0, 48);
  const hint = String((raw && raw.hint) || "").trim().slice(0, 120);
  if (name.length < 2) return null;
  const emoticons = sanitizeEmoticons(raw && raw.emoticons);
  if (!emoticons) return null;
  return { name, hint, emoticons };
}

// ── Express + Socket.io ───────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
  pingInterval: 25000,
  pingTimeout: 60000,
  transports: ["websocket", "polling"],
});

app.set("trust proxy", 1);
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const state = {
  question: { id: null, text: "", active: false, emoticons: [], presetId: "referidos" },
  participants: new Map(),
  votes: new Map(),
};

function currentEmoticons() {
  if (state.question.emoticons && state.question.emoticons.length) return state.question.emoticons;
  return PRESETS[0].emoticons;
}

function emptyCounts(emoticons) {
  return Object.fromEntries(emoticons.map((e) => [e.id, 0]));
}

function publicState() {
  const emoticons = currentEmoticons();
  const counts = emptyCounts(emoticons);
  const voters = Object.fromEntries(emoticons.map((e) => [e.id, []]));
  for (const vote of state.votes.values()) {
    if (!(vote.emoticonId in counts)) continue;
    counts[vote.emoticonId] += 1;
    voters[vote.emoticonId].push({ name: vote.name, at: vote.at });
  }
  return {
    emoticons,
    presets: PRESETS,
    question: {
      id: state.question.id,
      text: state.question.text,
      active: state.question.active,
      presetId: state.question.presetId || "",
    },
    participantCount: state.participants.size,
    voteCount: state.votes.size,
    counts, voters,
    participants: [...state.participants.values()].map((p) => ({ id: p.id, name: p.name })),
  };
}

function broadcast() { io.emit("state", publicState()); }

app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/admin",  (_req, res) => res.sendFile(path.join(__dirname, "public", "admin.html")));
app.get("/api/presets", (_req, res) => res.json(PRESETS));

// ── Sockets ───────────────────────────────────────────────────────────────
io.on("connection", (socket) => {
  socket.emit("state", publicState());

  socket.on("join", ({ name }) => {
    const clean = String(name || "").replace(/[^\p{L}\p{N} .'-]/gu, "").trim().slice(0, 32);
    if (clean.length < 2) { socket.emit("error-msg", "Escribe un nombre de al menos 2 caracteres."); return; }
    const existing = [...state.participants.values()].find(
      (p) => p.socketId !== socket.id && p.name.toLowerCase() === clean.toLowerCase()
    );
    if (existing) { socket.emit("error-msg", "Ese nombre ya está en uso. Prueba con otro."); return; }
    state.participants.set(socket.id, { id: socket.id, socketId: socket.id, name: clean, joinedAt: Date.now() });
    socket.emit("joined", { name: clean, id: socket.id });
    broadcast();
  });

  socket.on("vote", ({ emoticonId }) => {
    const participant = state.participants.get(socket.id);
    if (!participant)              { socket.emit("error-msg", "Entra primero con tu nombre."); return; }
    if (!state.question.active)   { socket.emit("error-msg", "No hay una votación abierta."); return; }
    const chosen = currentEmoticons().find((e) => e.id === emoticonId);
    if (!chosen) { socket.emit("error-msg", "Emoticón no válido para esta pregunta."); return; }
    state.votes.set(participant.name.toLowerCase(), { emoticonId, name: participant.name, at: Date.now() });
    io.emit("vote-pulse", { name: participant.name, emoticonId, emoji: chosen.emoji });
    broadcast();
  });

  socket.on("admin:auth", ({ pin }) => {
    if (String(pin) !== ADMIN_PIN) { socket.emit("admin:auth-result", { ok: false }); return; }
    socket.data.isAdmin = true;
    socket.emit("admin:auth-result", { ok: true, presets: PRESETS });
    socket.emit("state", publicState());
  });

  socket.on("admin:set-question", ({ text, emoticons, presetId }) => {
    if (!socket.data.isAdmin) return;
    const clean = String(text || "").trim().slice(0, 280);
    if (clean.length < 4) { socket.emit("error-msg", "La pregunta debe tener al menos 4 caracteres."); return; }
    const cleanedEmos = sanitizeEmoticons(emoticons);
    if (!cleanedEmos) { socket.emit("error-msg", "Revisa los emoticones: mínimo 2, cada uno con emoji, nombre y significado."); return; }
    const knownPreset = PRESETS.some((p) => p.id === presetId) ? presetId : "custom";
    state.question = { id: Date.now().toString(36), text: clean, active: true, emoticons: cleanedEmos, presetId: knownPreset };
    state.votes.clear();
    broadcast();
  });

  socket.on("admin:toggle",       () => { if (!socket.data.isAdmin || !state.question.id) return; state.question.active = !state.question.active; broadcast(); });
  socket.on("admin:reset-votes",  () => { if (!socket.data.isAdmin) return; state.votes.clear(); broadcast(); });
  socket.on("admin:clear-question", () => {
    if (!socket.data.isAdmin) return;
    state.question = { id: null, text: "", active: false, emoticons: [], presetId: "referidos" };
    state.votes.clear();
    broadcast();
  });

  // ── Gestión de mazos ────────────────────────────────────────────────────
  socket.on("admin:save-preset", ({ id, data }) => {
    if (!socket.data.isAdmin) return;
    const clean = sanitizePreset(data);
    if (!clean) { socket.emit("error-msg", "Revisa el mazo: necesita nombre y al menos 2 emoticones completos."); return; }
    const idx = PRESETS.findIndex((p) => p.id === id);
    if (idx >= 0) {
      PRESETS[idx] = { ...PRESETS[idx], ...clean };
    } else {
      PRESETS.push({ id: `preset-${Date.now().toString(36)}`, ...clean });
    }
    savePresets(PRESETS);
    socket.emit("admin:presets-updated", { ok: true, presets: PRESETS });
    broadcast();
  });

  socket.on("admin:delete-preset", ({ id }) => {
    if (!socket.data.isAdmin) return;
    if (PRESETS.length <= 1) { socket.emit("error-msg", "Debe quedar al menos un mazo."); return; }
    PRESETS = PRESETS.filter((p) => p.id !== id);
    savePresets(PRESETS);
    socket.emit("admin:presets-updated", { ok: true, presets: PRESETS });
    broadcast();
  });

  socket.on("admin:new-preset", () => {
    if (!socket.data.isAdmin) return;
    const newPreset = {
      id: `preset-${Date.now().toString(36)}`,
      name: "Nuevo mazo",
      hint: "",
      emoticons: [
        { id: "opt-0", emoji: "⭐", label: "Opción 1", meaning: "Significado de esta opción." },
        { id: "opt-1", emoji: "💫", label: "Opción 2", meaning: "Significado de esta opción." },
      ],
    };
    PRESETS.push(newPreset);
    savePresets(PRESETS);
    socket.emit("admin:presets-updated", { ok: true, presets: PRESETS });
    broadcast();
  });

  socket.on("disconnect", () => {
    const wasIn = state.participants.has(socket.id);
    state.participants.delete(socket.id);
    if (wasIn) broadcast();
  });
});

function lanAddress() {
  const nets = os.networkInterfaces();
  for (const addrs of Object.values(nets))
    for (const net of addrs || [])
      if (net.family === "IPv4" && !net.internal) return net.address;
  return null;
}

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Plataforma emoticones en puerto ${PORT}`);
  if (process.env.NODE_ENV !== "production") {
    const lan = lanAddress();
    console.log(`Local: http://localhost:${PORT}`);
    if (lan) console.log(`En el celular (misma WiFi): http://${lan}:${PORT}`);
    console.log(`Panel admin: http://localhost:${PORT}/admin`);
    console.log(`PIN de admin: ${ADMIN_PIN}`);
  }
});
