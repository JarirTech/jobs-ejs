const User = require("../models/User");
const parseVErr = require("../util/parseValidationErrs");

const registerShow = (req, res) => {
  res.render("register");
};

const registerDo = async (req, res, next) => {
  if (req.body.password != req.body.password1) {
    req.flash("error", "The passwords entered do not match.");
    return res.render("register", { errors: req.flash("error") });
  }

  try {
    await User.create(req.body);
  } catch (e) {
    if (e.constructor.name === "ValidationError") {
      parseVErr(e, req);
    } else if (e.name === "MongoServerError" && e.code === 11000) {
      req.flash("error", "That email address is already registered.");
    } else {
      return next(e);
    }
    return res.render("register", { errors: req.flash("error") });
  }

  res.redirect("/");
};



const logonShow = (req, res) => {
  if (req.user) {
    return res.redirect("/");
  }
  res.render("logon", {
//     errors: req.flash("error"),
//     info: req.flash("info"),
  });
};
const logoff = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
    }
    res.redirect("/");
  });
};

module.exports = {
  registerShow,
  registerDo,
  logoff,
  logonShow,
};