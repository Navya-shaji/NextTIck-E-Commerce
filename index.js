const express = require("express");
const app = express(); // app server instance
const path = require("path");
const session = require("express-session");
const env = require("dotenv").config(); // inputing .env
const passport = require("./config/passport");
const db = require("./config/db");
const userRouter = require("./routes/userRouter");
const adminRouter = require("./routes/adminRouter");
const nocache = require("nocache")
const Cart = require("./models/cartSchema");

db();

app.use(express.json()); //middleware
app.use(express.urlencoded({ extended: true }));
app.use(nocache())
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.use(express.static(path.join(__dirname, "public")));

const guestMiddleware = require("./middlewares/guestMiddleware");
const { guestRateLimiter } = require("./middlewares/rateLimiter");

app.use(passport.initialize());
app.use(passport.session());
app.use(guestRateLimiter);
app.use(guestMiddleware);

app.use((req, res, next) => {
  res.set("cache-control", "no-store");
  next();
});

app.use(async (req, res, next) => {
  try {
    const sessionUser = req.session.user || req.session.passport?.user;
    const userId = sessionUser?._id || sessionUser || req.session.guestUserId;

    if (userId) {
      const cart = await Cart.findOne({ userId });
      res.locals.cartCount = cart ? cart.items.reduce((total, item) => total + item.quantity, 0) : 0;
    } else {
      res.locals.cartCount = 0;
    }
    next();
  } catch (error) {
    console.error("Error in cart count middleware:", error);
    res.locals.cartCount = 0;
    next();
  }
});

app.set("view engine", "ejs");

app.set("views", [
  path.join(__dirname, "views/user"),
  path.join(__dirname, "views/admin"),
]);



app.use("/admin", adminRouter);
app.use("/", userRouter);


const PORT = process.env.PORT || 1212;
app.listen(PORT, () => {
  console.log("Server Running!...........");
});

module.exports = app;
