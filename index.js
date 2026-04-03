// ===============================
// TALIB-MD Bot Config
// ===============================

const ownerName = "🍷𓆩𝐓𝐚𝐥𝐢𝐛 ​᭄𝐌𝐃🚩"; // Display name
const ownerNumber = "923431798985";        // WhatsApp number

// Import required modules
import { Boom } from "@hapi/boom";
import NodeCache from "cacheable/node-cache";
import readline from "readline";
import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion } from "@adiwajshing/baileys";
import P from "pino";
import qrcode from "qrcode-terminal";

// Logger setup
const logger = P({
  level: "trace",
  transport: {
    targets: [
      { target: "pino-pretty", options: { colorize: true } },
      { target: "pino/file", options: { destination: "./logs.log" } }
    ]
  }
});

// Example function to show owner info
function showOwnerInfo() {
  console.log(`Bot Owner: ${ownerName}`);
  console.log(`Owner Number: ${ownerNumber}`);
}

// Initialize bot
async function startBot() {
  try {
    showOwnerInfo();
    // Here you can add your Baileys initialization logic
    console.log("Bot is starting...");
    // Example QR code generation
    qrcode.generate("https://wa.me/" + ownerNumber, { small: true });
  } catch (err) {
    console.error("Error starting bot:", err);
  }
}

// Run bot
startBot();
