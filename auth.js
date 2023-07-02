const jwt = require("jsonwebtoken");

function generateAccessToken(username) {
  return jwt.sign(username, process.env.TOKEN_SECRET, { expiresIn: "10m" });
}

function generateRefreshToken(username) {
  return jwt.sign(username, process.env.REFRESH_SECRET);
}

function getUserFromRefreshToken(refreshToken) {
  return jwt.verify(refreshToken, process.env.REFRESH_SECRET, (err, user) => {
    if (err) throw err;
    return user;
  });
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  getUserFromRefreshToken,
  authenticateToken: function (req, res, next) {
    // const authHeader = req.headers["authorization"];
    const token = req.cookies.accessToken;
    if (token === null) return res.sendStatus(401);

    jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  },
  verifyRefreshToken: function (refreshToken) {
    return jwt.verify(refreshToken, process.env.REFRESH_SECRET, (err, user) => {
      if (err) throw err;
      const accessToken = generateAccessToken({ username: user.username });
      return accessToken;
    });
  },
};
