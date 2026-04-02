const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs");
const config = require("./config");
require("./server");

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("session");

  const sock = makeWASocket({
    logger: pino({ level: "silent" }),
    auth: state,
    printQRInTerminal: true // ✅ QR SHOW HOGA
  });

  sock.ev.on("creds.update", saveCreds);

  // ✅ Load commands (FIXED)
  const commands = [];
  fs.readdirSync("./commands").forEach(file => {
    commands.push(require(`./commands/${file}`));
  });

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

    // 🤖 AUTO REPLY
    if (!isCmd && config.AUTO_REPLY) {
      await sock.sendMessage(from, { text: "🤖 TALIB-MD ACTIVE" });
    }

    // 🚫 ANTI LINK
    if (config.ANTI_LINK && msg.includes("chat.whatsapp.com")) {
      await sock.sendMessage(from, { text: "🚫 Links not allowed!" });
    }

    // ⚡ RUN COMMANDS
    for (let cmd of commands) {
      if (cmd.name === command) {
        cmd.execute(sock, m, msg);
      }
    }
  });

  // 👥 WELCOME / GOODBYE
  sock.ev.on("group-participants.update", async (data) => {
    const id = data.id;

    for (let user of data.participants) {
      if (data.action === "add") {
        await sock.sendMessage(id, {
          text: `👋 Welcome @${user.split("@")[0]} 🔥`,
          mentions: [user]
        });
      } else if (data.action === "remove") {
        await sock.sendMessage(id, {
          text: `❌ Goodbye @${user.split("@")[0]}`,
          mentions: [user]
        });
      }
    }
  });

  // 🛑 ANTI DELETE
  sock.ev.on("messages.update", async updates => {
    for (let update of updates) {
      if (update.update.message === null) {
        await sock.sendMessage(update.key.remoteJid, {
          text: "⚠️ Deleted message detected!"
        });
      }
    }
  });

  // 🔁 AUTO RECONNECT (IMPORTANT FIX)
  sock.ev.on("connection.update", (update) => {
    const { connection } = update;

    if (connection === "close") {
      console.log("❌ Connection closed, reconnecting...");
      startBot(); // restart bot
    } else if (connection === "open") {
      console.log("✅ Bot connected successfully!");
    }
  });
}

startBot();
