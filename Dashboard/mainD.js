const { app, BrowserWindow, ipcMain } = require("electron")
const fs = require("fs")
const csv = require("csv-parser")

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: __dirname + "/preload.js",
    },
  })

  win.loadFile("Manage.html")
}

app.whenReady().then(createWindow)

// Function to parse CSV starting from the correct header line
function parseCSVFromHeader(filePath) {
  return new Promise((resolve, reject) => {
    try {
      const content = fs.readFileSync(filePath, "utf8")
      const lines = content.split("\n")

      // Find the header line
      let headerLineIndex = -1
      for (let i = 0; i < lines.length; i++) {
        if (
          lines[i].includes("MSSV") &&
          lines[i].includes("Check-in") &&
          lines[i].includes("Check-out") &&
          lines[i].includes("Place") &&
          lines[i].includes("CardNumber")
        ) {
          headerLineIndex = i
          break
        }
      }

      if (headerLineIndex === -1) {
        reject(new Error("Could not find header line in Log.csv"))
        return
      }

      // Get CSV data from header onwards
      const csvData = lines.slice(headerLineIndex).join("\n")
      const results = []

      const stream = require("stream")
      const readable = new stream.Readable()
      readable.push(csvData)
      readable.push(null)

      readable
        .pipe(csv({ separator: ",", skipEmptyLines: true }))
        .on("data", (data) => {
          if (data["MSSV"] && data["MSSV"].trim() !== "" && data["MSSV"] !== "MSSV") {
            results.push(data)
          }
        })
        .on("end", () => {
          resolve(results)
        })
        .on("error", (err) => {
          reject(err)
        })
    } catch (error) {
      reject(error)
    }
  })
}

// Get all students from the actual CSV file for dashboard
ipcMain.handle("getAllStudents", async () => {
  const filePath = "D:\\RFID\\StudentUI\\Log.csv"

  try {
    const results = await parseCSVFromHeader(filePath)
    console.log("Dashboard loaded", results.length, "student records")
    return results
  } catch (error) {
    console.error("Error loading students:", error)
    return []
  }
})
