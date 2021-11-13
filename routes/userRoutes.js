import express from "express";
import multer from "multer";
import passport from "passport";
import Users from "../models/userSchema.js";
import {
  userRegisterValidation,
  userProfileValidation,
  validateErrors,
} from "../utils/validation.js";
import { generateToken, verifyUser } from "../utils/passportAuth.js";
import { ImageDelete, fileFilter, mv, Storage } from "../utils/helpers.js";

const userRoute = express.Router();

userRoute.get("/", async (req, res, next) => {
  try {
    const user = await Users.find({}).select(
      "-passHash -passSalt -__v -userType"
    );

    res.status(200).json(user);
  } catch (err) {
    err.statusCode = 404;
    err.message = "No User Found ";
    next(err);
  }
});

userRoute.get("/:authorId", async (req, res, next) => {
  try {
    const user = await Users.findById(req.params.authorId).select(
      "-passHash -passSalt -__v -userType"
    );

    res.status(200).json(user);
  } catch (err) {
    err.statusCode = 404;
    err.message = "No User Found With given id";
    next(err);
  }
});

userRoute.post(
  "/register",
  userRegisterValidation(),
  validateErrors,
  async (req, res, next) => {
    try {
      const findUser = await Users.findOne({
        $or: [{ username: req.body.username }, { email: req.body.email }],
      }).select("username");

      if (findUser) {
        return res.status(404).json({
          errors: [
            {
              msg: "A user with the given username/email is already registered",
            },
          ],
        });
      }

      const user = new Users({
        username: req.body.username,
        email: req.body.email,
      });
      user.setPassword(req.body.password);
      await user.save();
      res.status(200).json({
        message: "Registration Successful!",
      });
    } catch (err) {
      err.statusCode = 500;
      console.log(err);
      err.message = err;
      next(err);
    }
  }
);

userRoute.post("/login", (req, res, next) => {
  passport.authenticate("local", function (err, user, info) {
    if (err) {
      next(err);
      return;
    }
    if (!user) {
      return res.status(402).json(info);
    }
    req.logIn(user, function (err) {
      if (err) {
        return res.status(404).json({ Error: err });
      }
      res.status(200).json({
        message: "Login Successful",
        username: user.username,
        email: user.email,
        _id: user.id,
        profileImage: user.profileImage,
        token: generateToken(user),
      });
    });
  })(req, res, next);
});

const upload = multer({
  storage: Storage("profileImages"),
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
  fileFilter: fileFilter,
}).single("profileImage");

userRoute.put(
  "/profile",
  verifyUser,
  mv(upload),
  userProfileValidation(),
  validateErrors,
  async (req, res, next) => {
    let filePath = req.file === undefined ? "" : req.file.path;
    let {
      username,
      about,
      email,
      facebookAddress,
      twitterAddress,
      instagramAddress,
    } = req.body;
    try {
      const user = await Users.findById(req.user.id).select(
        "-createdAt -updatedAt -__v -passSalt -passHash -userType"
      );

      try {
        user.username = username;
        user.email = email;
        user.about = about;
        user.facebookAddress = facebookAddress;
        user.twitterAddress = twitterAddress;
        user.instagramAddress = instagramAddress;

        if (filePath === "") {
          user.profileImage = user.profileImage;
        } else {
          ImageDelete(user.profileImage);
          user.profileImage = filePath;
        }
        const userUpdated = await user.save();
        res.status(200).json({
          message: "profile data updated successfully",
          username: userUpdated.username,
          email: userUpdated.email,
          _id: userUpdated._id,
          profileImage: userUpdated.profileImage,
          token: generateToken(userUpdated),
        });

        //         message:'profile data updated successfully',
        // username: user.username,
        // email: user.email,
        // profileImage:user.profileImage
        // _id:user._id,
        // token: generateToken(user)
      } catch (err) {
        console.log(err);
        // ImageDelete(req.file.path);
        err.statusCode = 404;
        err.message = err;
        next(err);
      }
    } catch (err) {
      err.statusCode = 404;
      err.message = "No User Found With given id";
      next(err);
    }
  }
);

export default userRoute;

// const user = await Users.findByIdAndUpdate(req.user.id,

// {
//     $set: {
//       username,
//       about,
//       email,
//       facebookAddress,
//       twitterAddress,
//       instagramAddress,
//       profileImage : req.file === undefined ? profileImage : req.file.path
//       },
// },
// {new: true, useFindAndModify:false}

// );
// console.log(user);
// res.status(204).json(
//   {
//     message:'profile data updated successfully',
//     username: user.username,
//     email: user.email,
//     profileImage:user.profileImage
//     // _id:user._id,
//     // token: generateToken(user),
//   }
// );
