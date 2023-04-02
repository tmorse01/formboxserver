const jwt = require("jsonwebtoken");

function generateAccessToken(username) {
  return jwt.sign(username, process.env.TOKEN_SECRET, { expiresIn: "30s" });
}

function generateRefreshToken(username) {
  return jwt.sign(username, process.env.REFRESH_SECRET);
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  authenticateToken: function (req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // grab token from BEARER TOKEN
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
