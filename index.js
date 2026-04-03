const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys")

const fs = require("fs")

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("session")

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false
  })

  sock.ev.on("creds.update", saveCreds)

  // 🔥 PAIRING CODE SYSTEM
  if (!sock.authState.creds.registered) {
    const phoneNumber = "923431798985" // 👈 apna number yahan likh (without +)

    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(phoneNumber)
        console.log("PAIRING CODE:", code)
      } catch (err) {
        console.log("Error getting pairing code:", err)
      }
    }, 3000)
  }

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode
      if (reason !== DisconnectReason.loggedOut) {
        startBot()
      }
    } else if (connection === "open") {
      console.log("✅ Bot Connected Successfully")
    }
  })
}

startBot()
