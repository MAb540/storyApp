import express from "express";
import mongoose from "mongoose";
import morgan from "morgan";
import passport from 'passport';
import commentRoute from "./routes/commentRoutes.js";

import storyRoute from "./routes/storyRoutes.js";
import userRoute from "./routes/userRoutes.js";
import path from 'path';

const app = express();
const PORT = process.env.PORT || 5000;

import {Authen} from './utils/passportAuth.js';


mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/Story", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify:false
});

mongoose.connection
.once("open", () => {
  console.log("Db Connected");
})
.on('error',(err)=>{
  console.log(err)
})




// Data parsing
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

if (process.env.NODE_ENV === "Production") {
  app.use(express.static("client/build"));
}

// images folder publicily available
app.use('/uploads',express.static(path.join('.', 'uploads/profileImages')))
// Http Request logger
app.use(morgan("dev"));

// passport middleware
app.use(passport.initialize());

// images folder publicily available
app.use('/uploads/',express.static(path.join('.', 'uploads/')))

// Routes
app.use("/api/stories", storyRoute);
app.use("/api/users", userRoute);
app.use('/api/comments',commentRoute)

app.get("/", (req, res) => {
  res.send("working");
});

// error handler middle ware
app.use((err, req, res, next) => {
    const {statusCode,message} = err;
    if (!statusCode) err.statusCode = 500;
    
    return res.status(statusCode).json({
        status:"error",
        statusCode,
        message
    });
    
});

app.listen(PORT, () => {
  console.log("server is running on port " + PORT);
});
