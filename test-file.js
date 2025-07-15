// Test script to check IP detection and location mapping
const os = require("os")

console.log("=== TESTING LOCATION DETECTION ===")

// Function to get current IP address
function getCurrentIPAddress() {
  const interfaces = os.networkInterfaces()

  console.log("All network interfaces:")
  for (const name of Object.keys(interfaces)) {
    console.log(`\nInterface: ${name}`)
    for (const iface of interfaces[name]) {
      console.log(`  ${iface.family}: ${iface.address} (internal: ${iface.internal})`)

      // Skip internal and non-IPv4 addresses
      if (iface.family === "IPv4" && !iface.internal) {
        console.log(`  ✅ This will be used as current IP`)
        return iface.address
      }
    }
  }
  return null
}

// Function to determine location based on IP address
function getLocationFromIP(ipAddress) {
  console.log(`\nChecking location for IP: ${ipAddress}`)

  if (ipAddress === "10.1.30.165") {
    return "Nguyen Van Trang"
  }

  if (ipAddress && ipAddress.startsWith("10.1.30.")) {
    return "Nguyen Van Trang Campus"
  }

  if (ipAddress && ipAddress.startsWith("192.168.")) {
    return "Home/Private Network"
  }

  return `Unknown Location (${ipAddress})`
}

// Test the detection
const currentIP = getCurrentIPAddress()
const currentLocation = getLocationFromIP(currentIP)

console.log("\n=== RESULTS ===")
console.log("Current IP:", currentIP)
console.log("Detected Location:", currentLocation)

// Test with your specific IP
console.log("\n=== TESTING YOUR IP ===")
const yourIP = "10.1.30.165"
const yourLocation = getLocationFromIP(yourIP)
console.log(`IP ${yourIP} → Location: ${yourLocation}`)

console.log("\n=== TESTING OTHER IPs ===")
const testIPs = ["10.1.30.100", "192.168.1.100", "172.16.1.100"]
testIPs.forEach((ip) => {
  console.log(`IP ${ip} → Location: ${getLocationFromIP(ip)}`)
})
