const axios = require("axios");

module.exports = {
  name: "ai",
  execute: async (sock, m, msg) => {
    let q = msg.split(" ").slice(1).join(" ");
    if (!q) return;

    let res = await axios.get(`https://api.affiliateplus.xyz/api/chatbot?message=${q}&botname=Talib`);
    sock.sendMessage(m.key.remoteJid, { text: res.data.message });
  }
};