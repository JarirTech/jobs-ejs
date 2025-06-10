

const express = require("express");
require("express-async-errors");

const app = express();

// Load environment variables
require("dotenv").config();

// Middleware
app.set("view engine", "ejs");
app.use(require("body-parser").urlencoded({ extended: true }));
app.use(express.json()); // Optional: allows JSON body parsing
app.use(require("connect-flash")());

const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);

const url = process.env.MONGO_URI;

const store = new MongoDBStore({
  uri: url,
  collection: "mySessions",
});

store.on("error", function (error) {
  console.log(error);
});

const sessionParms = {
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  store: store,
  cookie: {
    secure: false,
    httpOnly: true,
    sameSite: "strict",
  },
};

if (app.get("env") === "production") {
  app.set("trust proxy", 1);
  sessionParms.cookie.secure = true; // Use secure cookies in production
}

app.use(session(sessionParms));

// Passport setup
const passport = require("passport");
const passportInit = require("./passport/passportInit");
passportInit(passport); // Pass passport to initializer

app.use(passport.initialize());
app.use(passport.session());

// Store flash messages and user in locals
app.use(require("./middleware/storeLocals"));

// Routes

// Home route
app.get("/", (req, res) => {
  res.render("index");
});

// Secret word logic


const auth = require("./middleware/auth");

const secretWordRouter = require("./routes/secretWord");
app.use("/secretWord", auth, secretWordRouter);



// Session routes
app.use("/sessions", require("./routes/sessionRoutes"));

// 404 handler
app.use((req, res) => {
  res.status(404).send(`That page (${req.url}) was not found.`);
});

// General error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send(err.message);
});

// Server start
const port = process.env.PORT || 3000;

const start = async () => {
  try {
    await require("./db/connect")(process.env.MONGO_URI);
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();
