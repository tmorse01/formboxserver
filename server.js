const database = require("./database");
const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");

const {
  authenticateToken,
  verifyRefreshToken,
  getUserFromRefreshToken,
} = require("./auth");
const corsOptions = {
  origin: process.env.ORIGIN_URL,
  optionsSuccessStatus: 200,
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("views"));
app.use(cookieParser());

app.get("/api", (req, res) => {
  res.json({ message: "Hello from server!" });
});

app.post("/set-refresh-token", (req, res) => {
  const refreshToken = req.body.refreshToken;

  // Set the refresh token in an HTTP-only cookie with the Secure and SameSite attributes set
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
    path: "/",
  });

  res
    .status(200)
    .json({ ok: true, message: "Created cookie for refresh token" });
});

app.post("/set-access-token", (req, res) => {
  const accessToken = req.body.accessToken;

  // Set the refresh token in an HTTP-only cookie with the Secure and SameSite attributes set
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
    path: "/",
  });

  res.status(200).json({ ok: true, message: "Created cookie for acess token" });
});

app.post("/generate-access-token", (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  // console.log("generate-access-token", refreshToken);
  if (refreshToken === null) return res.status(401);

  database.getRefreshToken(refreshToken).then((result) => {
    // console.log("getRefreshToken result: ", result);
    if (result.token === undefined) return res.status(403);
    const newAccessToken = verifyRefreshToken(result.token);
    if (newAccessToken === undefined) return res.status(400);
    res.status(200).json({ ok: true, token: newAccessToken });
  });
});

app.post("/login", (req, res) => {
  // console.log("Login attempt", req.body);
  // delete any existing refreshTokens for this user
  database.login(req.body).then((token) => {
    // console.log("login res: ", token);
    if (token !== undefined) {
      // set the token in the cookies for future requests
      // console.log("setting accessToken :", token.accessToken);
      res.cookie("accessToken", token.accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: "Strict",
        path: "/",
      });
      res.status(200).json({
        ok: true,
        message: "User login succuessful",
        username: req.body.username,
        token: token,
      });
    } else {
      res.json({
        ok: false,
        error: {
          message: "Failed login. Please check your username and password.",
          username: req.body.username,
          token: undefined,
        },
      });
    }
  });
});

app.delete("/logout", (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  // console.log("logout refreshToken", refreshToken);
  database.deleteRefreshToken(refreshToken).then((deletedCount) => {
    // console.log("deleteRefreshToken: ", deletedCount);
    if (deletedCount === 0) {
      res.status(400).json({
        ok: false,
        error: {
          code: 400,
          message: "Error deleting refresh token.",
        },
      });
    } else {
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      res
        .status(200)
        .json({ ok: true, message: "Logged out", deletedCount: deletedCount });
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
    res.status(200).json({ ok: true, message: "Connected to mongodb client" });
  } else {
    res.status(500).json({
      ok: false,
      error: {
        code: 500,
        message: "Error connecting to mongodb client",
      },
    });
  }
});

app.post("/disconnectDb", async (req, res) => {
  // console.log("Closing connection to mongodb");
  var result = await database.disconnectDb();
  if (result === true) {
    res.status(200).json({ ok: true, message: "Disconnected mongodb client" });
  } else {
    res.status(500).json({
      ok: false,
      error: { code: 500, message: "Error disconnecting mongodb client" },
    });
  }
});

app.get("/getUser", (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (refreshToken !== undefined) {
    const user = getUserFromRefreshToken(req.cookies.refreshToken);
    if (user) {
      res.status(200).json({ ok: true, user: user });
    } else {
      res.status(500).json({
        ok: false,
        error: { code: 500, message: "Error getting user" },
      });
    }
  } else {
    res.status(200).json({
      ok: true,
      message: "No existing refresh token",
    });
  }
});

app.put("/submitFormValues", (req, res) => {
  // console.log("submitFormValues");
  var insertedRecord = database.createFormData(req.body);
  if (insertedRecord) {
    res.json({ ok: true, message: "Submitted your response." });
  } else {
    res.status(500).json({
      ok: false,
      error: { code: 500, message: "Error submitting your response." },
    });
  }
});

app.put("/saveForm", authenticateToken, (req, res) => {
  // console.log("saveForm", req.body);
  database.saveForm(req.body).then((success) => {
    if (success) {
      res.json({ ok: true, message: "Your form has been saved." });
    } else {
      res.status(500).json({
        ok: false,
        error: { code: 500, message: "There was an error saving your form." },
      });
    }
  });
});

app.get("/getForms", authenticateToken, (req, res) => {
  // console.log("getForms: ", req.user, req.cookies);
  const username = req.user.username;
  database.getForms(username).then((results) => {
    if (results !== null) {
      res.json({ ok: true, results: results });
    } else {
      res.status(500).json({
        ok: false,
        error: {
          code: 500,
          message: "There was an error getting your list of forms.",
        },
      });
    }
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

app.get("/", (req, res) => {
  // console.log("home");
  res.render("index");
});

app.listen(3001);
