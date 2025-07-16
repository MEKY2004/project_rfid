const { app, BrowserWindow, ipcMain } = require("electron")
const fs = require("fs")
const csv = require("csv-parser")
const os = require("os")
const usb = require("usb")
const { getMACAddress, getRFIDReaderID } = require("./systemSignature")

let environmentTrusted = false
let fingerprintRFID = {}
let currentMAC = "Unknown"
let currentRFID = "Unknown"

function getRFIDFingerprintViaUSB() {
  const devices = usb.getDeviceList()
  devices.forEach((device, index) => {
    const desc = device.deviceDescriptor
    console.log(`Device ${index + 1}: Vendor=${desc.idVendor.toString(16)}, Product=${desc.idProduct.toString(16)}`)
  })

    const reader = devices.find(d => {
    const desc = d.deviceDescriptor
    const vendor = desc.idVendor.toString(16).toLowerCase()
    const product = desc.idProduct.toString(16).padStart(4, "0").toLowerCase() // 👈 pad to 4 digits

    return vendor === "ffff" && product === "0035"
  })

  return reader ? { vendorId: "ffff", productId: "0035" } : {}
}

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  })
  win.loadFile("index.html")
}

async function initializeFingerprint() {
  currentMAC = getMACAddress()
  fingerprintRFID = getRFIDFingerprintViaUSB()
  currentRFID = fingerprintRFID.vendorId ? "Trusted-USB-Reader" : "Unknown-RFID"

  console.log("MAC Address:", currentMAC)
  console.log("RFID Reader ID:", currentRFID)
}

app.whenReady().then(async () => {
  await initializeFingerprint()

  const path = require("path")
  const trustedPath = path.join(__dirname, "trustedSignature.json")
  const trusted = JSON.parse(fs.readFileSync(trustedPath, "utf8"))

  function validateEnvironment() {
    const trustedIPPrefix = trusted.trustedIPPrefix?.trim().toLowerCase()
    const macMatch = currentMAC.toLowerCase() === trusted.trustedMAC.toLowerCase()
    const readerMatch = fingerprintRFID.vendorId?.toLowerCase() === trusted.trustedRFID.vendorId &&
                        fingerprintRFID.productId?.toLowerCase() === trusted.trustedRFID.productId
    const currentIP = getCurrentIPAddress()?.toLowerCase()
    const ipMatch = currentIP?.startsWith(trustedIPPrefix)

    environmentTrusted = macMatch && readerMatch && ipMatch

    if (!environmentTrusted) {
      console.warn("Untrusted environment detected!")
      console.warn(`MAC match: ${macMatch}`)
      console.warn(`RFID match: ${readerMatch}`)
      console.warn(`IP match: ${ipMatch}`)
      // Block sensitive features as needed
    } else {
      console.log("Trusted MAC, RFID, and IP match.")
    }
  }
  validateEnvironment()

  createWindow()
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit()
})

// 🧭 Retrieve current IP address
function getCurrentIPAddress() {
  const interfaces = os.networkInterfaces()
  const preferredOrder = ["Wi-Fi", "Ethernet", "en0", "eth0", "wlan0"]
  for (const name of preferredOrder) {
    const ifaceList = interfaces[name]
    if (!ifaceList) continue
    for (const iface of ifaceList) {
      if (iface.family === "IPv4" && !iface.internal) return iface.address
    }
  }
  return null
}

// 📍 Map IP to physical location
function getLocationFromIP(ipAddress) {
  if (ipAddress.startsWith("10.106.56")) {
    const lastOctet = parseInt(ipAddress.split(".")[3], 10)
    if (lastOctet >= 70 && lastOctet <= 200) return "Thành Thái"
  }
  if (ipAddress === "192.168.1.55") return "Lyn Coffee"
  return "Unknown"
}

// 📁 Read and parse CSV starting from header
function parseCSVFromHeader(filePath) {
  return new Promise((resolve, reject) => {
    try {
      const content = fs.readFileSync(filePath, "utf8")
      const lines = content.split("\n")
      let headerLineIndex = -1
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("MSSV") && lines[i].includes("CardNumber")) {
          headerLineIndex = i
          break
        }
      }
      if (headerLineIndex === -1) return reject(new Error("Header not found"))
      const csvData = lines.slice(headerLineIndex).join("\n")

      const results = []
      const stream = require("stream")
      const readable = new stream.Readable()
      readable.push(csvData)
      readable.push(null)

      readable
        .pipe(csv({ separator: ",", skipEmptyLines: true }))
        .on("data", (data) => {
          if (data["MSSV"]?.trim() && data["MSSV"] !== "MSSV") {
            results.push(data)
          }
        })
        .on("end", () => resolve(results))
        .on("error", (err) => reject(err))
    } catch (error) {
      reject(error)
    }
  })
}

function parseDateTime(datetimeString) {
  const [datePart, timePart] = datetimeString.trim().split(" ")
  const [year, month, day] = datePart.split("-").map(Number)
  const [hour, minute, second] = (timePart ?? "00:00:00").split(":").map(Number)
  return new Date(year, month - 1, day, hour, minute, second || 0)
}

ipcMain.handle("getCurrentLocation", async () => {
  const ip = getCurrentIPAddress()
  const location = getLocationFromIP(ip)
  return { ip, location }
})

// 🧾 Handle card scan
ipcMain.handle("matchCard", async (event, cardNumber) => {

  if (!environmentTrusted) {
    console.error(`Scan blocked: Untrusted environment. Card ID ${cardNumber} ignored.`)
    event.sender.send("scanFailed", "Untrusted system — card scan rejected.")
    return
  }

  console.log(`Card scanned: ${cardNumber}`)
  // Proceed with your normal card logic here

  try {
    const databasePath = "D:\\RFID\\StudentUI\\database.csv"
    const logPath = "D:\\RFID\\StudentUI\\Log.csv"
    const currentIP = getCurrentIPAddress()
    const currentLocation = getLocationFromIP(currentIP)
    const currentTimestamp = new Date()
    const pad = (n) => String(n).padStart(2, "0")
    const currentDateTime = `${currentTimestamp.getFullYear()}-${pad(currentTimestamp.getMonth()+1)}-${pad(currentTimestamp.getDate())} ${pad(currentTimestamp.getHours())}:${pad(currentTimestamp.getMinutes())}:${pad(currentTimestamp.getSeconds())}`
    const currentTimeOnly = `${pad(currentTimestamp.getHours())}:${pad(currentTimestamp.getMinutes())}:${pad(currentTimestamp.getSeconds())}`
    const todayDate = currentDateTime.split(" ")[0].trim()

    if (!fs.existsSync(databasePath)) return { found: false, error: "Database file not found" }

    const students = await parseCSVFromHeader(databasePath)
    const student = students.find((row) => row["CardNumber"]?.trim() === cardNumber?.trim())
    if (!student) return { found: false }

    if (!fs.existsSync(logPath)) {
      const header = "MSSV,Name,Date,Check-in Time,Check-out Time,Place,CardNumber\n"
      fs.writeFileSync(logPath, header, "utf8")
    }

    const logContent = fs.readFileSync(logPath, "utf8")
    const lines = logContent.split("\n").filter(line => line.trim() !== "")

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",")
      if (cols.length < 6) continue

      const mssv = cols[0]?.trim()
      const name = cols[1]?.trim()
      const checkInDate = cols[2]?.trim()
      const checkInTime = cols[3]?.trim()
      let checkOutTime = cols[4]?.trim()
      const place = cols[5]?.trim()

      const matchedToday = mssv === student["MSSV"] && checkInDate === todayDate

      if (matchedToday) {
        if (!checkInTime || checkInTime === "") {
          console.warn("No valid check-in time for matching record:", cols)
          break
        }

        // Calculate time elapsed since check-in
        const fullCheckInTime = `${checkInDate} ${checkInTime}`
        const checkInTimestamp = new Date(fullCheckInTime)

        if (isNaN(checkInTimestamp.getTime())) {
          console.warn("Invalid timestamp:", fullCheckInTime)
          break
        }

        const elapsedMinutes = (currentTimestamp - checkInTimestamp) / (1000 * 60)

        if (!checkOutTime || checkOutTime.trim() === "") {
          if (elapsedMinutes >= 0.2) {
            // Append check-out time
            cols[4] = currentTimeOnly
            lines[i] = cols.join(",")
            fs.writeFileSync(logPath, lines.join("\n"), "utf8")

            await updateSheetRow(mssv, todayDate, [
              mssv, name, checkInDate, checkInTime, currentTimeOnly, place, ""
            ])

            console.log("Check-out updated")
            return {
              found: true,
              data: { ...student, currentIP, detectedLocation: currentLocation },
              action: "check-out"
            }
          } else {
            console.log("⏱ Scan too soon after check-in, ignoring")
            return {
              found: true,
              data: { ...student, currentIP, detectedLocation: currentLocation },
              action: "ignored"
            }
          }
        } else {
          console.log("Already checked in and out today")
          return {
            found: true,
            data: { ...student, currentIP, detectedLocation: currentLocation },
            action: "ignored"
          }
        }
      }
    }

    // No matching same-day entry found: log a new check-in
    const logRow = [
      student["MSSV"],
      student["Name"],
      todayDate,          
      currentTimeOnly,    
      "",                
      currentLocation,
      student["CardNumber"]
    ]
    fs.appendFileSync(logPath, logRow.join(",") + "\n", "utf8")

    const filteredLogRow = [
      student["MSSV"],
      student["Name"],
      todayDate,
      currentTimeOnly,
      "",
      currentLocation,
      ""
    ]
    await updateSheetRow(student["MSSV"], todayDate, filteredLogRow)
    console.log("Check-in logged")

    return {
      found: true,
      data: {
        ...student,
        currentIP,
        detectedLocation: currentLocation,
      },
      action: "check-in"
}

  } catch (err) {
    console.error("Unexpected error:", err)
    return { found: false, error: err.message }
  }
})  

const { google } = require("googleapis")
const path = require("path")

async function readSheetFromRow4() {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, "credentials.json"), 
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  })

  const client = await auth.getClient()
  const sheets = google.sheets({ version: "v4", auth: client })

  const spreadsheetId = "1WNCA3-ObyihD6eLbgzWCu3ajnb_ZnukUDH8AiZY99JA" 
  const range = "Tháng 7!A4:H" 

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range
  })

  const rows = res.data.values
  if (!rows || rows.length === 0) {
    console.log("No data found.")
    return
  }

  rows.forEach((row, index) => {
    console.log(`Row ${index + 4}:`, row)
  })
}

async function updateSheetRow(mssv, date, updatedRow) {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, "credentials.json"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  })

  const client = await auth.getClient()
  const sheets = google.sheets({ version: "v4", auth: client })

  const spreadsheetId = "1WNCA3-ObyihD6eLbgzWCu3ajnb_ZnukUDH8AiZY99JA"
  const sheetName = "Tháng 7"
  const startRow = 4
  const readRange = `${sheetName}!A${startRow}:G`

  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: readRange })
  const rows = res.data.values || []

  let targetRowIndex = -1
  rows.forEach((row, index) => {
    if (row[0] === mssv && row[2] === date) {
      targetRowIndex = index + startRow
    }
  })

  if (targetRowIndex !== -1) {
    const updateRange = `${sheetName}!A${targetRowIndex}:G${targetRowIndex}`
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: updateRange,
      valueInputOption: "RAW",
      requestBody: {
        values: [updatedRow]
      }
    })
  } else {
    const appendRange = `${sheetName}!A${startRow}`
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: appendRange,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [updatedRow]
      }
    })
  }
}

//Retrieve all log entries
ipcMain.handle("getAllLogs", async () => {
  const filePath = "D:\\RFID\\StudentUI\\Log.csv"
  try {
    const results = await parseCSVFromHeader(filePath)
    return results
  } catch (err) {
    console.error("Error reading log file:", err)
    return []
  }
})
