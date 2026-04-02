const config = require("../config");

module.exports = {
  name: "menu",
  execute: async (sock, m) => {
    sock.sendMessage(m.key.remoteJid, {
      image: { url: config.MENU_IMAGE },
      caption: `👑 ${config.BOT_NAME}

👤 ${config.OWNER_NAME}

📥 .tt
👥 .kick
🤖 .ai
⚙️ .owner

🔥 FULL POWER BOT`
    });
  }
};