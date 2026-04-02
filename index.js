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
  });

  sock.ev.on("creds.update", saveCreds);

  // Load commands
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

    // AUTO REPLY
    if (!isCmd && config.AUTO_REPLY) {
      sock.sendMessage(from, { text: "🤖 TALIB-MD ACTIVE" });
    }

    // ANTI LINK
    if (config.ANTI_LINK && msg.includes("chat.whatsapp.com")) {
      sock.sendMessage(from, { text: "🚫 Links not allowed!" });
    }

    // Run commands
    for (let cmd of commands) {
      if (cmd.name === command) {
        cmd.execute(sock, m, msg);
      }
    }
  });

  // Welcome / Goodbye
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

  // Anti delete
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