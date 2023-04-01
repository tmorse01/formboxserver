const database = require("./database");
const express = require("express");
const app = express();
const cors = require("cors");
const { authenticateToken, verifyRefreshToken } = require("./auth");
const corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("views"));

// database.connectToServer();

app.get("/api", (req, res) => {
  res.json({ message: "Hello from server!" });
});

app.post("/token", (req, res) => {
  const username = req.body.username;
  const refreshToken = req.body.token;
  if (refreshToken === null) return res.status(401);

  database.getRefreshToken(username, refreshToken).then((result) => {
    if (result.token === undefined) return res.status(403);
    const newAccessToken = verifyRefreshToken(result.token);
    if (newAccessToken === undefined) return res.status(400);
    res.status(200).json({ token: newAccessToken });
  });
});

app.post("/login", (req, res) => {
  // console.log("Login attempt", req.body);
  database.login(req.body).then((token) => {
    // console.log("login res: ", token);
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

app.delete("/logout", (req, res) => {
  const refreshToken = req.body.token;
  const username = req.body.username;
  database.deleteRefreshToken(username, refreshToken).then((deletedCount) => {
    console.log("deletedCount: ", deletedCount);
    if (deletedCount === 0) {
      res.status(400).json({
        ok: false,
        error: {
          code: 400,
          message: "Error deleting refresh token.",
        },
      });
    } else {
      res.status(200).json({ deletedCount: deletedCount });
    }
  });
});

app.post("/signup", async (req, res) => {
  // console.log("Signup", req.body);
  try {
    const loginInfo = req.body;
    const result = await database.signup(loginInfo);
    // console.log("Result of sign up: ", result);
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({
      ok: false,
      error: {
        code: 400,
        message: e.message,
      },
    });
  }
});

app.post("/connectToDb", async (req, res) => {
  console.log("Connecting to mongodb");
  var client = await database.connectToServer();
  if (client) {
    res.status(200).json({ message: "Connected to mongodb client" });
  } else {
    res.status(500).json({ error: "Error connecting to mongodb client" });
  }
});

app.post("/disconnectDb", async (req, res) => {
  // console.log("Closing connection to mongodb");
  var result = await database.disconnectDb();
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
      // handle more error cases
      // user not signed in
      //
      res.json({
        error: "There was an error saving your form.",
      });
    }
  });
});

app.get("/getForms", authenticateToken, (req, res) => {
  console.log("getForms: ", req.user);
  const username = req.user.username;
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
        ok: false,
        error: {
          code: 400,
          message: "No form found by that name.",
        },
      });
    } else {
      res.status(200).json({ ok: true, results: results });
    }
  });
});

app.post("/getFormData", authenticateToken, (req, res) => {
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
