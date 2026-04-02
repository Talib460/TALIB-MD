const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs");
const config = require("./config");

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("session");

  const sock = makeWASocket({
    logger: pino({ level: "silent" }),
    auth: state,
  });

  sock.ev.on("creds.update", saveCreds);

  // ✅ CONNECTION + QR
  sock.ev.on("connection.update", (update) => {
    const { connection, qr } = update;

    if (qr) {
      console.log("📱 Scan QR Code:");
      console.log(qr);
    }

    if (connection === "open") {
      console.log("✅ BOT CONNECTED");
    }

    if (connection === "close") {
      console.log("❌ Connection closed, retrying...");
      startBot();
    }
  });

  // ✅ LOAD COMMANDS
  const commands = [];
  const path = "./commands";

  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(file => {
      if (file.endsWith(".js")) {
        commands.push(require(`${path}/${file}`));
      }
    });
  } else {
    console.log("❌ commands folder not found");
  }

  // ✅ MESSAGE HANDLER
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

    // AUTO REPLY
    if (!isCmd && config.AUTO_REPLY) {
      sock.sendMessage(from, { text: "🤖 TALIB-MD ACTIVE" });
    }

    // ANTI LINK
    if (config.ANTI_LINK && msg.includes("chat.whatsapp.com")) {
      sock.sendMessage(from, { text: "🚫 Links not allowed!" });
    }

    // RUN COMMANDS
    for (let cmd of commands) {
      if (cmd.name === command) {
        cmd.execute(sock, m, msg);
      }
    }
  });

  // ✅ GROUP EVENTS
  sock.ev.on("group-participants.update", async (data) => {
    const id = data.id;

    for (let user of data.participants) {
      if (data.action === "add") {
        sock.sendMessage(id, {
          text: `👋 Welcome @${user.split("@")[0]} 🔥`,
          mentions: [user]
        });
      } else if (data.action === "remove") {
        sock.sendMessage(id, {
          text: `❌ Goodbye @${user.split("@")[0]}`,
          mentions: [user]
        });
      }
    }
  });

  // ✅ ANTI DELETE
  sock.ev.on("messages.update", async updates => {
    for (let update of updates) {
      if (update.update.message === null) {
        sock.sendMessage(update.key.remoteJid, {
          text: "⚠️ Deleted message detected!"
        });
      }
    }
  });
}

startBot();
