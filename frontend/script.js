const form = document.getElementById("taskForm");
const taskList = document.getElementById("taskList").querySelector("tbody");
const taskLogs = document.getElementById("taskLogs").querySelector("tbody");


form.addEventListener("submit", async function (e) {
  e.preventDefault();
  const taskName = document.getElementById("taskName").value;
  const frequency = document.getElementById("frequency").value;
  const reciepent = document.getElementById("email").value;

  try {
    const response = await fetch("https://to-do-task-fxqh.onrender.com/add-task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskName, frequency,reciepent}),
      credentials: "include" // Only if needed
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = await response.json();
    if (result.success) {
      alert("Task scheduled successfully");
      // Append new task to the task list
      const row = taskList.insertRow();
      row.id = `task-${taskName}`; // Add unique ID to the row for easy removal later
      row.innerHTML = `
        <td>${taskName}</td>
        <td>${frequency}</td>
        <td>${result.nextExecution}</td>
        <td>Active</td>
      `;
    } else {
      alert("Error scheduling task");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("An error occurred while scheduling the task");
  }
});

// Fetch all tasks and display them
async function showData() {
  try {
    const response = await fetch("https://to-do-task-fxqh.onrender.com/tasks");
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const allTaskRes = await response.json();
    taskList.innerHTML = ""; // Clear current task list
    allTaskRes.map((task) => {
      const row = taskList.insertRow();
      row.id = `task-${task.taskName}`; // Add unique ID to the row for easy removal later
      row.innerHTML = `
        <td>${task.taskName}</td>
        <td>${task.frequency}</td>
        <td>${task.nextExecution}</td>
        <td>Active</td>
      `;
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
  }
}

// Fetch all logs and display them
async function showLogData() {
  try {
    const response = await fetch("https://to-do-task-fxqh.onrender.com/logs");
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const allTaskRes = await response.json();
    taskLogs.innerHTML = ""; // Clear current logs
    allTaskRes.map((task) => {
      // Remove the task from the task list when it moves to the logs
      const taskRow = document.getElementById(`task-${task.taskName}`);
      if (taskRow) {
        taskRow.remove();
      }

      // Add the task to the logs section
      const row = taskLogs.insertRow();
      row.innerHTML = `
        <td>${task.taskName}</td>
        <td>${new Date(task.executionTime).toLocaleString()}</td>
        <td>${task.status}</td>
        <td>${task.message}</td>
      `;
    });
  } catch (error) {
    console.error("Error fetching logs:", error);
  }
}

// Polling function to update logs periodically (every 5 seconds)
// Uncomment if needed
setInterval(async () => {
  await showLogData();
}, 20000); // Fetch logs every 5 seconds

// Initial data loading
// Uncomment if needed
showData();
showLogData();
