document.addEventListener("DOMContentLoaded", async () => {
    await loadStudents()
  
    // Auto-refresh every 10 seconds
    setInterval(loadStudents, 10000)
  })
  
  async function loadStudents() {
    try {
      const tableBody = document.querySelector("#studentsTable tbody")
      const students = await window.electronAPI.getAllStudents()
  
      // Clear existing rows
      tableBody.innerHTML = ""
  
      // Update stats
      updateStats(students)
  
      students.forEach((student) => {
        const tr = document.createElement("tr")
  
        // Determine status
        let status = "Not Checked"
        let statusColor = "#856404"
  
        if (student["Check-in Time"] && student["Check-out Time"]) {
          status = "Completed"
          statusColor = "#004085"
        } else if (student["Check-in Time"]) {
          status = "Checked In"
          statusColor = "#155724"
        }
        const checkInTime = student["Check-in Time"] || ""
        const checkOutTime = student["Check-out Time"] || ""
        const datePart = student["Date"] || ""
        const checkinTimeS = checkInTime.includes(" ") ? checkInTime.split(" ")[1] : checkInTime
        const checkoutTime = checkOutTime.includes(" ") ? checkOutTime.split(" ")[1] : checkOutTime

        tr.innerHTML = `
          <td>${student["MSSV"] || "N/A"}</td>
          <td>${student["Name"] || "N/A"}</td>
          <td>${datePart || "N/A"}</td>
          <td>${checkinTimeS || "-"}</td>
          <td>${checkoutTime || "-"}</td>
          <td>${student["Place"] || "N/A"}</td>
          <td>${student["CardNumber"] || "N/A"}</td>
          <td style="color: ${statusColor}; font-weight: bold;">${status}</td>
        `

  
        tableBody.appendChild(tr)
      })
  
      // Update last refresh time
      const now = new Date().toLocaleString("vi-VN")
      const lastUpdateElement = document.getElementById("lastUpdate")
      if (lastUpdateElement) {
        lastUpdateElement.textContent = `Last updated: ${now}`
      }
    } catch (error) {
      console.error("Error loading students:", error)
    }
  }
  
  function updateStats(students) {
    const statsContainer = document.getElementById("stats")
    if (!statsContainer) return
  
    const totalStudents = students.length
    const checkedIn = students.filter((s) => s["Check-in Time"] && !s["Check-out Time"]).length
    const checkedOut = students.filter((s) => s["Check-in Time"] && s["Check-out Time"]).length
    const notChecked = students.filter((s) => !s["Check-in Time"]).length
  
    statsContainer.innerHTML = `
          <div style="background: white; padding: 20px; border-radius: 10px; text-align: center; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
              <div style="font-size: 2em; font-weight: bold; color: #667eea;">${totalStudents}</div>
              <div style="color: #666;">Total Students</div>
          </div>
          <div style="background: white; padding: 20px; border-radius: 10px; text-align: center; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
              <div style="font-size: 2em; font-weight: bold; color: #28a745;">${checkedIn}</div>
              <div style="color: #666;">Currently In</div>
          </div>
          <div style="background: white; padding: 20px; border-radius: 10px; text-align: center; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
              <div style="font-size: 2em; font-weight: bold; color: #007bff;">${checkedOut}</div>
              <div style="color: #666;">Completed</div>
          </div>
          <div style="background: white; padding: 20px; border-radius: 10px; text-align: center; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
              <div style="font-size: 2em; font-weight: bold; color: #ffc107;">${notChecked}</div>
              <div style="color: #666;">Not Checked</div>
          </div>
      `
  }
  