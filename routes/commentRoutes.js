import express from "express";

import Comments from "../models/commentSchems.js";
import Stories from "../models/storySchema.js";
import { verifyUser } from "../utils/passportAuth.js";
import { commentValidation, validateErrors } from "../utils/validation.js";

const commentRoute = express.Router();

commentRoute
  .route("/")
  .get(async (req, res, next) => {
    try {
      const comments = await Comments.find()
        .select("-createdAt -updatedAt -__v")
        .sort({ createdAt: "desc" });
      res.status(200).json(comments);
    } catch (err) {
      err.statusCode = 404;
      err.message = "No Comment Found";
      next(err);
    }
  })
  .post(
    verifyUser,
    commentValidation(),
    validateErrors,
    async (req, res, next) => {
      try {
        if (await Stories.exists({ _id: req.body.storyId })) {
          const comment = new Comments({
            authorId: req.user.id,
            storyId: req.body.storyId,
            commentBody: req.body.commentBody,
          });
          const commentCreated = await comment.save();
          res.status(201).json({ commentCreated, message: "Comment Created" });
          return;
        }
      } catch (err) {
        //console.log(err);
        err.statusCode = 500;
        err.message = "Story with given id does not Exist";
        next(err);
      }
    }
  )

  .put(verifyUser, async (req, res) => {
    res.status(404).json({ message: "Comment can not updated on this route" });
  })

  .delete(verifyUser, async (req, res) => {
    res.status(404).json({ message: "Only for Admins" });
  });

commentRoute.route("/story/:storyId").get(async (req, res, next) => {
  try {
    const comments = await Comments.find({ storyId: req.params.storyId })
      .select("-createdAt -updatedAt -__v")
      .sort({ createdAt: "desc" })
      .populate({
        path:'authorId',
        select:'username profileImage'
      })
    res.status(200).json(comments);
  } catch (err) {
    err.statusCode = 500;
    err.message = "Story with given id does not Exist";
    next(err);
  }
});

commentRoute
  .route("/:commentId")
  .get(async (req, res, next) => {
    try {
      const comment = await Comments.findById(req.params.commentId).select(
        "-createdAt -updatedAt -__v"
      );
      res.status(200).json(comment);
    } catch (err) {
      err.statusCode = 404;
      err.message = "Comment with given does not exist";
      next(err);
    }
  })
  .post(verifyUser, async (req, res) => {
    res.status(404).json({ message: "Comment can not created on this route" });
  })
  .put(verifyUser, commentValidation(), validateErrors, async (req, res) => {
    try {
      const comment = await Comments.findById({
        _id: req.params.commentId,
      }).populate({ path: "Author", select: "userType" });
      if (!comment.authorId._id.equals(req.user.id)) {
        return res
          .status(401)
          .json({ message: "you are not authorized for this action" });
      }
      comment.commentBody = req.body.commentBody;
      const updatedComment = await comment.save();
      res.status(200).json({
        message: "Your comment has been updated",
        comment: updatedComment,
      });
    } catch (err) {
      err.statusCode = 404;
      err.message = "Comment with given id not Found";
      next(err);
    }
  })

  .delete(verifyUser, async (req, res, next) => {
    try {
      const comment = await Comments.findById({
        _id: req.params.commentId,
      }).populate({
        path: "authorId",
        select: "_id",
      });
      if (!comment.authorId._id.equals(req.user.id)) {
        return res
          .status(401)
          .json({ message: "you are not authorized for this action" });
      }

      await Comments.findByIdAndDelete({ _id: req.params.commentId });
      res.status(200).json({ message: "Comment has been deleted." });
    } catch (err) {
      err.statusCode = 404;
      err.message = "Comment with given id not Found";
      next(err);
    }
  });

export default commentRoute;
