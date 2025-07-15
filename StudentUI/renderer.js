const { ipcRenderer } = require("electron")

// Get the input field and button elements
const rfidInput = document.getElementById("rfidInput")
const scanButton = document.getElementById("scanButton")
const resultDiv = document.getElementById("result")
const locationDiv = document.getElementById("locationInfo")

// Auto-focus on input field
rfidInput.focus()

// Display current location on page load
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const locationInfo = await ipcRenderer.invoke("getCurrentLocation")
    if (locationDiv) {
      locationDiv.innerHTML = `
        <strong>📍 Current Location:</strong><br>
        IP Address: ${locationInfo.ip}<br>
        Location: ${locationInfo.location}
      `
    }
  } catch (error) {
    console.error("Error getting location:", error)
  }
})

// Event listener for Enter key
rfidInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    scanCard()
  }
})

// Event listener for the button click
scanButton.addEventListener("click", scanCard)

async function scanCard() {
  const cardNumber = rfidInput.value.trim()

  console.log("=== RENDERER DEBUG ===")
  console.log("Input value:", cardNumber)
  console.log("Input type:", typeof cardNumber)

  if (cardNumber) {
    try {
      // Send the card number to the main process for matching
      const result = await ipcRenderer.invoke("matchCard", cardNumber)

      console.log("Result from main process:", result)

      // Display the result
      if (result.found) {
        displayStudentInfo(result)
      } else {
        displayError("Card not found in system")
      }

      // Clear input for next scan
      rfidInput.value = ""
      rfidInput.focus()
    } catch (error) {
      console.error("Error in scanCard:", error)
      displayError(`Error: ${error.message}`)
    }
  } else {
    displayError("Please enter a card number")
  }
}

function displayStudentInfo(result) {
  const data = result.data
  const action = result.action
  const message = result.message

  let statusMessage = ""
  const statusClass = "success"

  if (message) {
    statusMessage = `<div style="color: orange; font-weight: bold; font-size: 20px; margin-bottom: 20px;">⚠️ ${message}</div>`
  } else if (action === "check-in") {
    statusMessage =
      '<div style="color: green; font-weight: bold; font-size: 20px; margin-bottom: 20px;">✅ Successfully Checked In</div>'
  } else if (action === "check-out") {
    statusMessage =
      '<div style="color: blue; font-weight: bold; font-size: 20px; margin-bottom: 20px;">🚪 Successfully Checked Out</div>'
  }

  resultDiv.className = `result-card ${statusClass}`
  resultDiv.style.display = "block"

  // Create a comprehensive display of student data including location info
  resultDiv.innerHTML = `
        ${statusMessage}
        <div style="background: #f8f9fa; padding: 25px; border-radius: 15px; margin-top: 15px;">
            <h3 style="color: #333; margin-bottom: 25px; text-align: center; font-size: 24px;">👤 Student Information</h3>
            
            <!-- Main Student Info -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px; text-align: center;">
                    <div style="font-size: 14px; opacity: 0.9; margin-bottom: 5px;">STUDENT ID</div>
                    <div style="font-size: 24px; font-weight: bold;">${data["MSSV"] || "N/A"}</div>
                </div>
                
                <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 20px; border-radius: 12px; text-align: center;">
                    <div style="font-size: 14px; opacity: 0.9; margin-bottom: 5px;">FULL NAME</div>
                    <div style="font-size: 20px; font-weight: bold;">${data["Name"] || "N/A"}</div>
                </div>
            </div>

            <!-- Location Info -->
            <div style="background: linear-gradient(135deg, #17a2b8 0%, #138496 100%); color: white; padding: 20px; border-radius: 12px; margin-bottom: 25px; text-align: center;">
                <div style="font-size: 14px; opacity: 0.9; margin-bottom: 5px;">📍 LOCATION DETECTED</div>
                <div style="font-size: 18px; font-weight: bold;">${data["Place"] || data.detectedLocation || "Unknown"}</div>
                <div style="font-size: 12px; opacity: 0.8; margin-top: 5px;">IP: ${data.currentIP || "Unknown"}</div>
            </div>

            <!-- Check-in/Check-out Times -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
                <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border-left: 5px solid #28a745;">
                    <div style="color: #28a745; font-weight: bold; font-size: 16px; margin-bottom: 8px;">🕐 CHECK-IN TIME</div>
                    <div style="font-size: 18px; color: ${data["Check-in"] ? "#28a745" : "#6c757d"}; font-weight: ${data["Check-in"] ? "bold" : "normal"};">
                        ${data["Check-in"] || "Not checked in"}
                    </div>
                </div>
                
                <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border-left: 5px solid #007bff;">
                    <div style="color: #007bff; font-weight: bold; font-size: 16px; margin-bottom: 8px;">🕐 CHECK-OUT TIME</div>
                    <div style="font-size: 18px; color: ${data["Check-out"] ? "#007bff" : "#6c757d"}; font-weight: ${data["Check-out"] ? "bold" : "normal"};">
                        ${data["Check-out"] || "Not checked out"}
                    </div>
                </div>
            </div>

            <!-- Additional Information -->
            <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                <h4 style="color: #333; margin-bottom: 15px; font-size: 18px;">📋 Additional Details</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                  
                    <div style="padding: 12px; background: #f8f9fa; border-radius: 8px; border-left: 3px solid #667eea;">
                        <strong style="color: #495057; font-size: 14px;">Card Number:</strong><br>
                        <span style="color: #212529; font-size: 16px;">${data["CardNumber"] || "N/A"}</span>
                    </div>
                    
                    <div style="padding: 12px; background: #f8f9fa; border-radius: 8px; border-left: 3px solid #667eea;">
                        <strong style="color: #495057; font-size: 14px;">Date:</strong><br>
                        <span style="color: #212529; font-size: 16px;">${data["Date"] || "N/A"}</span>
                    </div>
                    
                    <div style="padding: 12px; background: #f8f9fa; border-radius: 8px; border-left: 3px solid #667eea;">
                        <strong style="color: #495057; font-size: 14px;">Place:</strong><br>
                        <span style="color: #212529; font-size: 16px;">${data["Place"] || "N/A"}</span>
                    </div>
                </div>

            </div>

            <!-- Status Summary -->
            <div style="text-align: center; margin-top: 25px; padding: 20px; background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%); border-radius: 12px;">
                <strong style="color: #495057; font-size: 18px;">
                    📊 Current Status: 
                    <span style="color: ${data["Check-out"] ? "#007bff" : data["Check-in"] ? "#28a745" : "#ffc107"};">
                        ${
                          data["Check-out"]
                            ? "✅ Completed for today"
                            : data["Check-in"]
                              ? "🔄 Currently checked in"
                              : "⏳ Not checked in yet"
                        }
                    </span>
                </strong>
                ${
                  action === "check-in"
                    ? `<div style="margin-top: 10px; color: #28a745; font-weight: bold;">Welcome ${data["Name"]}! You checked in at ${data["Check-in"]} at ${data["Place"]}</div>`
                    : action === "check-out"
                      ? `<div style="margin-top: 10px; color: #007bff; font-weight: bold;">Thank you ${data["Name"]}! You checked out at ${data["Check-out"]}</div>`
                      : ""
                }
            </div>
        </div>
    `

  // Auto-hide after 10 seconds
  setTimeout(() => {
    resultDiv.style.display = "none"
  }, 10000)
}

function displayError(message) {
  resultDiv.className = "result-card error"
  resultDiv.style.display = "block"
  resultDiv.innerHTML = `<h3>❌ ${message}</h3>`

  // Auto-hide after 3 seconds
  setTimeout(() => {
    resultDiv.style.display = "none"
  }, 3000)
}
