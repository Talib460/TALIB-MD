const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys")
const pino = require("pino")

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("auth_info")

    const sock = makeWASocket({
        logger: pino({ level: "silent" }),
        auth: state,
        printQRInTerminal: false,
        browser: ["Ubuntu", "Chrome", "22.04.4"]
    })

    // ✅ ONLY ONE PAIRING CODE (WITH DELAY)
    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode("923431798985") // 👈 apna number
                console.log("\n======================")
                console.log("PAIRING CODE:", code)
                console.log("======================\n")
            } catch (err) {
                console.log("❌ Pairing Error:", err)
            }
        }, 5000)
    }

    // ✅ Save session
    sock.ev.on("creds.update", saveCreds)

    // ✅ Connection handling (NO SPAM RESTART)
    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update

        if (connection === "open") {
            console.log("✅ Bot Connected Successfully!")
        }

        if (connection === "close") {
            const reason = lastDisconnect?.error?.output?.statusCode

            if (reason === DisconnectReason.loggedOut) {
                console.log("❌ Logged out. Delete session and re-pair.")
            } else {
                console.log("⚠️ Connection closed, retrying in 10s...")
                setTimeout(() => startBot(), 10000) // slow restart (no spam)
            }
        }
    })
}

startBot()
