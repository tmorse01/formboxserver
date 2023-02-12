const database = require("./database");
const express = require("express");
const app = express();
const cors = require("cors");
const corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// database.connectToServer();

app.get("/api", (req, res) => {
  res.json({ message: "Hello from server!" });
});

app.post("/login", (req, res) => {
  // console.log("Login attempt", req.body);
  database.login(req.body).then((token) => {
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
  // console.log("Signup", req.body);
  database.signup(req, res);
});

app.get("/connectToDb", (req, res) => {
  // console.log("Connecting to mongodb");
  var client = database.connectToServer();
  if (client) {
    res.status(200).json({ message: "Connected to mongodb client" });
  } else {
    res.status(500).json({ error: "Error connecting to mongodb client" });
  }
});

app.get("/disconnectDb", (req, res) => {
  // console.log("Closing connection to mongodb");
  var result = database.disconnectDb();
  if (result === true) {
    res.status(200).json({ message: "Disconnected mongodb client" });
  } else {
    res.status(500).json({ error: "Error disconnecting mongodb client" });
  }
});

app.put("/submitFormValues", (req, res) => {
  // console.log("submitFormValues");
  var insertedRecord = database.createFormData(req.body);
  if (insertedRecord) {
    res.json({ message: "Submitted your response." });
  } else {
    res.json({ error: "Error submitting your response." });
  }
});

app.put("/saveForm", (req, res) => {
  // console.log("saveForm", req.body);
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

app.get("/getForm", (req, res) => {
  const queryParams = req.query;
  const form = queryParams.form;
  database.getForm(form).then((results) => {
    if (results === null) {
      res.status(400).json({
        success: false,
        error: {
          code: 400,
          message: "No form found by that name.",
        },
      });
    } else {
      res.status(200).json({ success: true, results: results });
    }
  });
});

app.post("/getFormData", (req, res) => {
  // console.log("getFormData", req.body);
  let formName = req.body.formName;
  database.getFormData(formName).then((results) => {
    res.json({ results: results });
  });
});

app.get("/", (req, res) => {
  // console.log("home");
  res.render("index");
});

app.listen(3001);
