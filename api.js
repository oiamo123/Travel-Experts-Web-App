const express = require("express");
const router = express.Router();
const mySql = require("mysql");
const argon2 = require("argon2");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const app = express();
const select = require("./public/modules/sqlFunctions.js");
const connection = require("./public/modules/connection.js");

const keyFile = fs.readFileSync("./jsonToken/privateKey.json", "utf8");
const keys = JSON.parse(keyFile);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

router.get("/admin", async (req, res) => {
  const data = await select("*", "packages");
  res.status(200).json(data);
});

router.get("/register", async (req, res) => {
  const data = await select("*", "agents");
  res.status(200).json(data);
});

router.get("/profile", async (req, res) => {
  const token = req.headers.cookie.split("token=")[1];
  const decoded = jwt.verify(token, keys.primaryKey);
  const sql =
    "SELECT * FROM `bookings` JOIN `bookingdetails` ON bookings.BookingId=bookingdetails.BookingDetailId WHERE bookings.CustomerId=" +
    decoded.userid;
  connection.query(sql, (err, results) => {
    res.status(200).json(results);
  });
});

// SELECT * FROM `bookings` JOIN `bookingdetails` ON  "BookingId"="BookingDetailId" WHERE CustomerId='104' ORDER BY bookings.BookingId ASC;

router.post("/register", async (req, res) => {
  const pass = await argon2.hash(req.body.password);
  const values = [
    req.body["f-name"],
    req.body["l-name"],
    req.body.address,
    req.body.city,
    req.body.province,
    req.body["postal-code"],
    req.body.country,
    req.body["home-tel"],
    req.body["business-tel"],
    req.body.email,
    req.body.agent,
    pass,
    req.body["user-id"],
  ];
  const sql =
    "INSERT INTO `customers` (`CustomerId`, `CustFirstName`, `CustLastName`, `CustAddress`,  `CustCity`, `CustProv`, `CustPostal`, `CustCountry`, `CustHomePhone`, `CustBusPhone`, `CustEmail`, `AgentId`, `Password`, `username`) VALUES (null,?,?,?,?,?,?,?,?,?,?,?,?,?)";
  connection.query(sql, values, (err, results) => {
    if (err) {
      throw err;
    } else {
      res.redirect("/confirm");
    }
  });
});

router.post("/sign-in", async (req, res) => {
  res.clearCookie("token");
  const data = await select(
    "*",
    "customers",
    `username="${req.body.username}"`
  );

  if (data[0] === undefined) {
    res.json({ user: false, password: false });
  } else if (await argon2.verify(data[0].Password, req.body.password)) {
    const keyFile = fs.readFileSync("./jsonToken/privateKey.json", "utf8");
    const keys = JSON.parse(keyFile);
    const token = jwt.sign(
      {
        userid: data[0].CustomerId,
        user: req.body.username,
        isAdmin: data[0].isAdmin === 0 ? false : true,
      },
      keys.primaryKey,
      {
        expiresIn: "1h",
      }
    );

    res.json({ user: true, password: true, token });
  } else {
    res.json({ user: true, password: false });
  }
});

module.exports = router;