document.addEventListener("DOMContentLoaded", () => {
  const taskForm = document.getElementById("task-form");
  const taskInput = document.getElementById("task-input");
  const taskList = document.getElementById("task-list");

  // Fetch and display tasks
  const fetchTasks = async () => {
    try {
      const response = await fetch("/tasks");
      const tasks = await response.json();
      taskList.innerHTML = "";
      tasks.forEach((task) => {
        const li = document.createElement("li");
        li.className = `list-group-item task-item ${
          task.completed ? "completed" : ""
        }`;
        li.innerHTML = `
          <span class="task-title">${task.title}</span>
          <div>
            <button class="btn btn-sm btn-success toggle-btn" data-id="${
              task.id
            }">
              ${task.completed ? "Undo" : "Complete"}
            </button>
            <button class="btn btn-sm btn-danger delete-btn" data-id="${
              task.id
            }">Delete</button>
          </div>
        `;
        taskList.appendChild(li);
      });
    } catch (err) {
      console.error("Error fetching tasks:", err);
    }
  };

  // Add new task
  taskForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = taskInput.value.trim();
    if (!title) return;
    try {
      await fetch("/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      taskInput.value = "";
      fetchTasks();
    } catch (err) {
      console.error("Error adding task:", err);
    }
  });

  // Toggle task completion
  taskList.addEventListener("click", async (e) => {
    if (e.target.classList.contains("toggle-btn")) {
      const id = e.target.dataset.id;
      const completed = e.target.textContent === "Complete";
      try {
        await fetch(`/tasks/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed }),
        });
        fetchTasks();
      } catch (err) {
        console.error("Error updating task:", err);
      }
    }
  });

  // Delete task
  taskList.addEventListener("click", async (e) => {
    if (e.target.classList.contains("delete-btn")) {
      const id = e.target.dataset.id;
      try {
        await fetch(`/tasks/${id}`, {
          method: "DELETE",
        });
        fetchTasks();
      } catch (err) {
        console.error("Error deleting task:", err);
      }
    }
  });

  // Initial fetch
  fetchTasks();
});
