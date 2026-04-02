module.exports = {
  name: "kick",
  execute: async (sock, m) => {
    let user = m.message.extendedTextMessage.contextInfo.participant;
    await sock.groupParticipantsUpdate(m.key.remoteJid, [user], "remove");
  }
};
