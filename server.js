const database = require("./database");
const express = require("express");
const app = express();
const cors = require("cors");
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api", (req, res) => {
  res.json({ message: "Hello from server!" });
});

app.get("/connectToDb", (req, res) => {
  console.log("CONNECT TO DB");
  database.connectToServer();
  // var dbClient = database.getClient();
  // console.log("dbClient on connect: ", dbClient);
  res.json({ message: "Connected to mongodb client" });
});

app.put("/submitFormValues", (req, res) => {
  console.log("submitFormValues", req.body);
  // console.log("submitFormValues dbClient: ", dbClient);
  database.createFormData(req.body);
  // res.json({ message: "Hello from server!" });
});

app.get("/", (req, res) => {
  console.log("home");
  res.render("index");
});

app.listen(3001);
