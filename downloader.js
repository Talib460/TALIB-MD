const axios = require("axios");

module.exports = {
  name: "tt",
  execute: async (sock, m, msg) => {
    let url = msg.split(" ")[1];
    if (!url) return;

    let res = await axios.get(`https://api.tiklydown.eu.org/api/download?url=${url}`);
    let video = res.data.video.noWatermark;

    sock.sendMessage(m.key.remoteJid, {
      video: { url: video },
      caption: "Downloaded"
    });
  }
};