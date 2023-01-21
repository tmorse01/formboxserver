const database = require("./database");
const express = require("express");
const app = express();
const cors = require("cors");
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// database.connectToServer();

app.get("/api", (req, res) => {
  res.json({ message: "Hello from server!" });
});

app.post("/login", (req, res) => {
  console.log("Login attempt", req.body);
  database.login(req.body).then((token) => {
    console.log("login token :", token);
    if (token !== undefined) {
      res.json({
        message: "User login succuessful",
        username: req.body.username,
        token: token,
      });
    } else {
      res.json({
        message: "Failed login. Please check your username and password.",
        username: req.body.username,
        token: undefined,
      });
    }
  });
});

app.post("/signup", (req, res) => {
  console.log("Signup", req.body);
  database.signup(req.body);
  res.json({ message: "User signup successful", token: "random" });
});

app.get("/connectToDb", (req, res) => {
  console.log("Connecting to mongodb");
  database.connectToServer();
  res.json({ message: "Connected to mongodb client" });
});

app.put("/submitFormValues", (req, res) => {
  console.log("submitFormValues", req.body);
  database.createFormData(req.body);
  res.json({ message: "Submitted your response." });
});

app.put("/saveForm", (req, res) => {
  console.log("saveForm", req.body);
  database.saveForm(req.body).then((success) => {
    if (success) {
      res.json({ message: "Your form has been saved." });
    } else {
      res.json({
        error: "There was an error saving your form.",
      });
    }
  });
});

app.get("/getForms", (req, res) => {
  const queryParams = req.query;
  const username = queryParams.username;
  database.getForms(username).then((results) => {
    res.json({ results: results });
  });
});

app.post("/getFormData", (req, res) => {
  console.log("getFormData", req.body);
  let documentName = req.body.documentName;
  database.getFormData(documentName).then((results) => {
    res.json({ results: results });
  });
});

app.get("/", (req, res) => {
  console.log("home");
  res.render("index");
});

app.listen(3001);
