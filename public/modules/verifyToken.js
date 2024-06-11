const jwt = require("jsonwebtoken");
const fs = require("fs");

const keyFile = fs.readFileSync("./jsonToken/privateKey.json", "utf8");
const keys = JSON.parse(keyFile);

const verifyToken = function (req, res, next) {
  const cookies = req.headers.cookie;
  if (!cookies) return res.status(401).redirect("/sign-in");
  const token = cookies.split("token=")[1];
  if (!token) return res.status(401).redirect("/sign-in");
  try {
    const decoded = jwt.verify(token, keys.primaryKey);
    req.username = decoded.username;
    if (req.url === "/profile") {
      next();
    } else {
      decoded.isAdmin ? next() : res.status(401).redirect("/sign-in");
    }
  } catch (err) {
    res.status(401).redirect("/sign-in");
  }
};

module.exports = verifyToken;