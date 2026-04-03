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

  // 🔥 AUTO PAIRING LOOP (retry until success)
  if (!sock.authState.creds.registered) {
    const phoneNumber = "923431798985" // 👈 apna number likh

    const requestCode = async () => {
      try {
        const code = await sock.requestPairingCode(phoneNumber)
        console.log("\n============================")
        console.log("PAIRING CODE:", code)
        console.log("============================\n")
      } catch (err) {
        console.log("Retrying pairing code...")
      }

      // ⏱️ har 25 sec me new code
      setTimeout(requestCode, 25000)
    }

    // 🔥 5 sec delay (tu ready ho jaye)
    setTimeout(requestCode, 5000)
  }

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode

      if (reason !== DisconnectReason.loggedOut) {
        console.log("Reconnecting...")
        startBot()
      } else {
        console.log("Logged out!")
      }
    }

    if (connection === "open") {
      console.log("✅ BOT CONNECTED SUCCESSFULLY")
    }
  })
}

startBot()

// ❌ crash fix
process.on("uncaughtException", console.error)
process.on("unhandledRejection", console.error)
