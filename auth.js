const jwt = require("jsonwebtoken");

module.exports = {
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
  generateAccessToken: function (username) {
    return jwt.sign(username, process.env.TOKEN_SECRET, { expiresIn: "15s" });
  },
  generateRefreshToken: function (username) {
    return jwt.sign(username, process.env.REFRESH_SECRET);
  },
};
