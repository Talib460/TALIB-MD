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

    // ✅ Sirf ek dafa pairing code
    if (!sock.authState.creds.registered) {
        const code = await sock.requestPairingCode("923431798985") // 👈 apna number likh
        console.log("\n==============================")
        console.log("PAIRING CODE:", code)
        console.log("==============================\n")
    }

    // ✅ creds save
    sock.ev.on("creds.update", saveCreds)

    // ✅ connection handler (NO LOOP)
    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update

        if (connection === "open") {
            console.log("✅ Bot Connected Successfully!")
        }

        if (connection === "close") {
            const reason = lastDisconnect?.error?.output?.statusCode

            if (reason === DisconnectReason.loggedOut) {
                console.log("❌ Logged out. Delete session and scan again.")
            } else {
                console.log("⚠️ Connection closed, restarting...")
                startBot() // reconnect only once
            }
        }
    })
}

startBot()
