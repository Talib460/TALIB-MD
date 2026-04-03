const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs");
const config = require("./config");

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("session");

  const sock = makeWASocket({
    logger: pino({ level: "silent" }),
    auth: state,
    browser: ["Talib-MD", "Chrome", "1.0"]
  });

  sock.ev.on("creds.update", saveCreds);

  // 🔥 PAIRING CODE SYSTEM
  if (!sock.authState.creds.registered) {
    const phoneNumber = "92XXXXXXXXXX"; // 👈 APNA NUMBER LIKH (92 se start)
    const code = await sock.requestPairingCode(phoneNumber);
    console.log(`🔥 PAIRING CODE: ${code}`);
  }

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;

      if (reason !== DisconnectReason.loggedOut) {
        console.log("🔄 Reconnecting...");
        startBot();
      } else {
        console.log("❌ Logged out, delete session and retry");
      }
    } else if (connection === "open") {
      console.log("✅ BOT CONNECTED");
    }
  });

  // Load commands
  const commands = [];
  if (fs.existsSync("./commands")) {
    fs.readdirSync("./commands").forEach(file => {
      commands.push(require(`./commands/${file}`));
    });
  }

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const m = messages[0];
    if (!m.message) return;

    const from = m.key.remoteJid;
    const msg =
      m.message.conversation ||
      m.message.extendedTextMessage?.text;

    if (!msg) return;

    const isCmd = msg.startsWith(config.PREFIX);
    const command = isCmd ? msg.slice(1).split(" ")[0].toLowerCase() : "";

    if (!isCmd && config.AUTO_REPLY) {
      sock.sendMessage(from, { text: "🤖 TALIB-MD ACTIVE" });
    }

    if (config.ANTI_LINK && msg.includes("chat.whatsapp.com")) {
      sock.sendMessage(from, { text: "🚫 Links not allowed!" });
    }

    for (let cmd of commands) {
      if (cmd.name === command) {
        cmd.execute(sock, m, msg);
      }
    }
  });
}

startBot();
