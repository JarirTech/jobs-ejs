
const express = require("express");
require("express-async-errors");
require("dotenv").config();

const app = express();

//VIEW ENGINE & BODY PARSERS  
app.set("view engine", "ejs");
app.use(require("body-parser").urlencoded({ extended: true }));
app.use(express.json());                               

//SESSION STORE  
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);

const store = new MongoDBStore({
  uri: process.env.MONGO_URI,
  collection: "mySessions",
});
store.on("error", console.error);

const sessionParms = {
  secret: process.env.SESSION_SECRET || "dev secret",
  resave: false,              
  saveUninitialized: false,  
  store,
  cookie: {
    secure: false,              
    httpOnly: true,
    sameSite: "strict",
  },
};

if (app.get("env") === "production") {
  app.set("trust proxy", 1);            
  sessionParms.cookie.secure = true;    
}

app.use(session(sessionParms));

//PASSPORT  
const passport = require("passport");
require("./passport/passportInit")(passport);          
app.use(passport.initialize());
app.use(passport.session());

//FLASH & LOCALS  
app.use(require("connect-flash")());                   
app.use(require("./middleware/storeLocals"));          

//ROUTES  
app.get("/", (req, res) => res.render("index"));

const auth = require("./middleware/auth");
app.use("/secretWord", auth, require("./routes/secretWord"));
app.use("/sessions", require("./routes/sessionRoutes"));

//404 & ERROR HANDLERS  
app.use((req, res) =>
  res.status(404).send(`That page (${req.url}) was not found.`)
);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send(err.message);
});

//Start SERVER  
const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await require("./db/connect")(process.env.MONGO_URI);
    app.listen(PORT, () => console.log(`Server listening on ${PORT}…`));
  } catch (err) {
    console.error(err);
  }
})
();


