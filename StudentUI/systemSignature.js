const os = require("os")
const { SerialPort } = require("serialport") // ← use destructuring for v10+

function getMACAddress() {
  const interfaces = os.networkInterfaces()
  const preferred = ["Wi-Fi", "Ethernet", "en0", "eth0", "wlan0"] // you can add others

  for (const name of preferred) {
    const iface = interfaces[name]
    if (!iface) continue
    for (const net of iface) {
      if (net.family === "IPv4" && !net.internal && net.mac !== "00:00:00:00:00:00") {
        return net.mac
      }
    }
  }
  return "Unknown-MAC"
}

async function getRFIDReaderID() {
  const ports = await SerialPort.list()

  // Skip filtering for now to see what data is returned
  const reader = ports[0]
  return reader?.serialNumber || reader?.path || "Unknown-RFID"
}

module.exports = {
  getMACAddress,
  getRFIDReaderID
}
