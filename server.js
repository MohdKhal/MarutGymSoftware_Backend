
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Marut Gym Software API",
    status: "running",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    application: "Marut Gym Software",
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Marut Gym backend running on port ${PORT}`);
});

