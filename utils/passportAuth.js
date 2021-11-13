import passport from "passport";
import LocalStrategy from "passport-local";
import JwtStrategy from "passport-jwt";
import ExtractJwt from "passport-jwt";
import jwt from "jsonwebtoken";

import Users from "../models/userSchema.js";

// const variables
const LS = LocalStrategy.Strategy;
const JWS = JwtStrategy.Strategy;
const EJWT = ExtractJwt.ExtractJwt;

// use of Passport Local Strategy
export const Authen = passport.use(
  new LS(function (username, password, done) {
    Users.findOne({ username })
      .then((userFound) => {
        if (!userFound || !userFound.matchPassword(password)) {
          return done(null, false, {
            message: "username or password is invalid",
          });
        }
        const user = userFound.userInfoWithOutPasswords();
        return done(null, user);
      })
      .catch((err) => {
        console.log(err);
        done(err);
      });
  })
);
// passport serializer for user
passport.serializeUser(function (user, done) {
  done(null, user.id);
});

// passport deserializer user
passport.deserializeUser(function (id, done) {
  Users.findById(id, function (err, user) {
    done(err, user);
  });
});

// token generate function
export const generateToken = (user) => {
  // let today = new Date();
  // let exp = new Date(today);
  // exp.setDate(today.getDate() + 1);

  // exp.getTime() / 1000

  return jwt.sign(
    {
      id: user.id,
      username: user.username,
    },
    process.env.TOKEN_SECRET || "someSEcret#12345",
    {expiresIn: '24h'}
  );
};

let opts = {};
opts.jwtFromRequest = EJWT.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.TOKEN_SECRET || "someSEcret#12345";

export const jwtPassport = passport.use(
  new JWS(opts, (jwt_payload, done) => {
    Users.findById({ _id: jwt_payload.id }, (err, userFound) => {
      if (err) {
        return done(err, null);
      }
      if (userFound) {
        const user = userFound.userInfoWithOutPasswords();
        return done(null, user);
      } else {
        return done(null, false);
      }
    });
  })
);

export const verifyUser = passport.authenticate("jwt", { session: false });
