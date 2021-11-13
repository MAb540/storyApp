import express from "express";
import { verifyUser } from "../utils/passportAuth.js";
import { storyValidatin, validateErrors } from "../utils/validation.js";
import { ImageDelete, fileFilter, mv, Storage } from "../utils/helpers.js";

import Stories from "../models/storySchema.js";
import Users from "../models/userSchema.js";

import multer from "multer";

const storyRoute = express.Router();

const upload = multer({
  storage: Storage("storyBgImages"),
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
  fileFilter: fileFilter,
}).single("storyBgImage");


storyRoute
  .route("/")
  .get(async (req, res, next) => {
    try {
      const stories = await Stories.find({ status: "public" })
        .sort({ createdAt: "desc" })
        .lean()
        .populate({
          path: "Author",
          select: "username",
        });
      res.status(200).json(stories);
    } catch (err) {
      err.statusCode = 404;
      err.message = "No Story Found";
      next(err);
    }
  })

  .post(
    verifyUser,
    mv(upload),
    storyValidatin(),
    validateErrors,
    async (req, res, next) => {
      let filePath = req.file === undefined ? "" : req.file.path;
      try {
        const story = new Stories({
          Author: req.user.id,
          title: req.body.title,
          body: req.body.body,
          status: req.body.status,
          backgroundImageUrl: filePath,
        });

        const storyCreated = await story.save();
        res.status(201).json({ storyCreated, message: "New Story Created" });
      } catch (err) {
        console.error(err);
        err.statusCode = 500;
        err.message = "Some error Occured";
        next(err);
      }
    }
  )
  .put(verifyUser, async (req, res) => {
    res.status(404).json({ message: "Story can not updated on this route" });
  })
  .delete(verifyUser, async (req, res, next) => {
    try {
      const findUser = await Users.findById({ _id: req.user.id }, "userType");
      if (findUser.userType === "Admin") {
        const { storiesIdsArray } = req.body;

        if (storiesIdsArray && storiesIdsArray.length > 0) {
          try {
            const storiesExists = await Stories.find({
              _id: { $in: storiesIdsArray },
            });
            if (storiesExists.length > 0) {
              const storiesDelete = await Stories.deleteMany({
                _id: { $in: storiesIdsArray },
              });
              console.log(storiesDelete);
              res.status(402).json();
            } else {
              res.status(404).json({
                status: "Not Success",
                Message: "stories with given ids does not exist.",
                postsIdsArray,
              });
            }
          } catch (err) {
            err.statusCode = 404;
            err.message = "Some id are not found in db";
            next(err);
          }
        } else {
          let err = new Error();
          err.statusCode = 400;
          err.message = "Missing fields in body or fields are Empty.";
          next(err);
        }
      } else {
        res.status(404).json({
          status: "Not Success",
          Message: "You are not Authorized for This Operation",
        });
      }
    } catch (err) {
      err.statusCode = 404;
      err.message = "User with given id does not exist";
      next(err);
    }
  });

storyRoute
  .route("/:storyId")
  .get(async (req, res, next) => {
    try {
      const story = await Stories.findById({ _id: req.params.storyId })
        .select("-createdAt -updatedAt -__v")
        .lean()
        .populate({
          path: "Author",
          select: "username",
        });
      res.status(200).json(story);
    } catch (err) {
      err.statusCode = 404;
      err.message = "Story with given id not Found";
      next(err);
    }
  })
  .post(async (req, res, next) => {
    res.status(404).json({ message: "Story can not created on this route" });
  })
  .put(
    verifyUser,
    mv(upload),
    storyValidatin(),
    validateErrors,
    async (req, res, next) => {
      let filePath = req.file === undefined ? "" : req.file.path;

      try {
        const story = await Stories.findById({
          _id: req.params.storyId,
        }).populate({ path: "Author", select: "userType" });
        if (!story.Author._id.equals(req.user.id)) {
          // because multer will save the image coming from any authenticated user but
          // we only want to save image coming from authorized user..

          ImageDelete(filePath);
          res
            .status(401)
            .json({ message: "you are not authorized for this action" });
          return;
        }

        story.title = req.body.title;
        story.body = req.body.body;
        story.status = req.body.status;
        if (filePath === "") {
          story.backgroundImageUrl = story.backgroundImageUrl;
        } else {
          ImageDelete(story.backgroundImageUrl);
          story.backgroundImageUrl = filePath;
        }
        const updatedStory = await story.save();
        res
          .status(200)
          .json({ message: "You story has been updated", story: updatedStory });
      } catch (err) {
        err.statusCode = 404;
        err.message = "Story with given id not Found";
        next(err);
      }
    }
  )
  .delete(verifyUser, async (req, res, next) => {
    try {
      const story = await Stories.findById({
        _id: req.params.storyId,
      }).populate({
        path: "Author",
        select: "_id",
      });
      if (!story.Author._id.equals(req.user.id)) {
        res
          .status(401)
          .json({ message: "you are not authorized for this action" });
        return;
      }
      try {
        ImageDelete(story.backgroundImageUrl); // helper for deleting images
        await Stories.findByIdAndDelete({ _id: req.params.storyId });
        res.status(200).json({ message: "story has been deleted." });
      } catch (err) {
        console.log(err);
        err.statusCode = 500;
        err.message = "Server Internal Error";
        next(err);
      }
    } catch (err) {
      err.statusCode = 404;
      err.message = "Story with given id not Found";
      next(err);
    }
  });

  storyRoute.get("/author/mystories",  verifyUser,async (req, res, next) => {
   
    try {
      const stories = await Stories.find({
        Author: req.user.id,
      })
        .sort({ createdAt: "desc" })
        .lean()
        .populate(
          "Author",
          "username"
        );
  
      res.status(200).json(stories);
    } catch (err) {
      err.statusCode = 404;
      err.message = "No Story Found";
      next(err);
    }
  });

storyRoute.get("/author/:authorId", async (req, res, next) => {
  try {
    const stories = await Stories.find({
      Author: req.params.authorId,
      status: "public",
    })
      .sort({ createdAt: "desc" })
      .lean()
      .populate(
        "Author",
        "username"
      );

    res.status(200).json(stories);
  } catch (err) {
    err.statusCode = 404;
    err.message = "No Story Found";
    next(err);
  }
});





export default storyRoute;

// let storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "uploads/storyBgImages");
//   },
//   filename: function (req, file, cb) {
//     cb(
//       null,
//       file.fieldname + "-" + Date.now() + path.extname(file.originalname)
//     );
//   },
// });

// function mv(upload) {
//   return (req, res, next) => {
//     upload(req, res, async function (err) {
//       if (err instanceof multer.MulterError) {
//         return res.status(415).json({ message: err });
//       } else if (err) {
//         // console.log(err);
//         return res.status(415).json({ message: err ,msg:'sign'});
//       }
//       next();
//     });
//   };
// }

// upload(req,res,async function(err){
//   if(err instanceof multer.MulterError){
//       return res.status(415).json({message:err})
//   }
//   else if(err){
//     console.log(err);
//     return res.status(415).json({message:err})
//   }
// })
// console.log(req.file);
// console.log(req.body);
// res.send('working')
