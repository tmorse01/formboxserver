const express = require("express");
const app = express();
const cors = require("cors");
app.use(cors());

app.get("/api", (req, res) => {
  res.json({ message: "Hello from server!" });
});

app.get("/", (req, res) => {
  console.log("home");
  res.render("index");
});

app.listen(3001);
