const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

require("dotenv").config();

app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname, "../public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

pool
  .connect()
  .then(() => console.log("Connected to PostgreSQL database"))
  .catch((err) => {
    console.error("Could not connect to PostgreSQL:", err.stack);
    process.exit(1);
  });

(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        completed BOOLEAN NOT NULL DEFAULT FALSE
      );
    `);
    console.log('Table "tasks" is ready.');
  } catch (err) {
    console.error("Error creating table:", err.stack);
  }
})();

app.get("/tasks", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM tasks");
    res.json(result.rows);
  } catch (err) {
    console.error(err.stack);
    res.status(500).send("Server error");
  }
});

app.post("/tasks", async (req, res) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).send("Title is required");
  }
  try {
    const result = await pool.query(
      "INSERT INTO tasks (title, completed) VALUES ($1, $2) RETURNING *",
      [title, false]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.stack);
    res.status(500).send("Server error");
  }
});

app.put("/tasks/:id", async (req, res) => {
  const { id } = req.params;
  let { completed } = req.body;
  if (typeof completed !== "boolean") {
    return res.status(400).send("Completed must be a boolean");
  }
  try {
    const result = await pool.query(
      "UPDATE tasks SET completed = $1 WHERE id = $2 RETURNING *",
      [completed, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).send("Task not found");
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.stack);
    res.status(500).send("Server error");
  }
});

app.delete("/tasks/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM tasks WHERE id = $1", [id]);
    if (result.rowCount === 0) {
      return res.status(404).send("Task not found");
    }
    res.send("Task deleted");
  } catch (err) {
    console.error(err.stack);
    res.status(500).send("Server error");
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
