const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys")
const pino = require("pino")

let pairingDone = false // ✅ important

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("auth_info")

    const sock = makeWASocket({
        logger: pino({ level: "silent" }),
        auth: state,
        printQRInTerminal: false,
        browser: ["Ubuntu", "Chrome", "22.04.4"]
    })

    // ✅ ONLY ONE TIME PAIRING (NO REPEAT EVER)
    if (!sock.authState.creds.registered && !pairingDone) {
        pairingDone = true

        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode("923431798985") // apna number
                console.log("\n======================")
                console.log("PAIRING CODE:", code)
                console.log("======================\n")
            } catch (err) {
                console.log("Pairing Error:", err)
            }
        }, 8000) // thoda zyada delay = stable
    }

    // ✅ save session
    sock.ev.on("creds.update", saveCreds)

    // ❌ NO AUTO RESTART LOOP (IMPORTANT)
    sock.ev.on("connection.update", (update) => {
        const { connection } = update

        if (connection === "open") {
            console.log("✅ Bot Connected Successfully!")
        }

        if (connection === "close") {
            console.log("❌ Connection closed. Restart manually if needed.")
        }
    })
}

startBot()
