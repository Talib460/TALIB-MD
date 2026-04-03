const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("session");

  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    browser: ["Ubuntu", "Chrome", "20.0"]
  });

  sock.ev.on("creds.update", saveCreds);

  // 🔥 pairing code loop (auto retry)
  async function requestCode() {
    try {
      const number = "923431798985"; // ⚠️ apna number yahan likh (92 se start)
      const code = await sock.requestPairingCode(number);
      console.log("PAIRING CODE:", code);
    } catch (err) {
      console.log("Retrying pairing code...");
    }
  }

  // 🔁 har 15 sec me new code
  setInterval(requestCode, 15000);

  sock.ev.on("connection.update", (update) => {
    const { connection } = update;

    if (connection === "open") {
      console.log("✅ Bot connected successfully!");
    }

    if (connection === "close") {
      console.log("❌ Connection closed, reconnecting...");
      startBot();
    }
  });
}

startBot();
