import mongoose from "mongoose";
import crypto from "crypto";

const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      minLength: 3,
    },
    about: {
      type: String,
      minLength: 15,
    },
    profileImage: {
      type: String,
      default:''
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    facebookAddress: {
      type: String,
    },
    twitterAddress: {
      type: String,
    },
    instagramAddress: {
      type: String,
    },

    passSalt: {
      type: String,
      required: true,
    },
    passHash: {
      type: String,
      required: true,
    },
    userType: {
      type: String,
      required: true,
      enum: ["Normal", "Admin"],
      default: "Normal",
    },

    // facebook address, twitter address, instagram address,linkin
  },
  {
    timestamps: true,
  }
);

userSchema.methods.setPassword = function (password) {
  this.passSalt = crypto.randomBytes(14).toString("hex");
  this.passHash = crypto
    .pbkdf2Sync(password, this.passSalt, 10000, 512, "sha256")
    .toString("hex");
};

userSchema.methods.matchPassword = function (password) {
  const hash = crypto
    .pbkdf2Sync(password, this.passSalt, 10000, 512, "sha256")
    .toString("hex");
  return this.passHash === hash;
};

userSchema.methods.userInfoWithOutPasswords = function () {
  return {
    username: this.username,
    email: this.email,
    id: this._id,
    __v: this.__v,
    profileImage:this.profileImage,
    userType: this.userType,
  };
};

const Users = mongoose.model("Users", userSchema);

export default Users;
