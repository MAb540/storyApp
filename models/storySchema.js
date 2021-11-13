import mongoose from "mongoose";

const Schema = mongoose.Schema;

const storySchema = new Schema(
  {
    Author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },

    title: {
      type: String,
      required: true,
      minLength: 3,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      minLength: 3,
    },
    status: {
      type: String,
      enum: ["public", "private"],
      default: "public",
      required:true
    },

    backgroundImageUrl:{
      type: String
    }


  },
  {
    timestamps: true,
  }
);

const Stories = mongoose.model("Stories", storySchema);

export default Stories;
