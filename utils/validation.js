import validationResult from "express-validator";
import body from "express-validator";
import {unlink} from 'fs/promises';
import path from 'path';

function userRegisterValidation() {
  return [
    body.body("username").notEmpty().trim().isLength({ min: 3 }),
    body.body("email").isEmail().normalizeEmail(),
    body.body("password").notEmpty().isLength({ min: 3 }),
  ];
}

function userProfileValidation() {
  return [
    body.body("username").notEmpty().trim().isLength({ min: 3 }),
    body.body("about").notEmpty().trim().isLength({ min: 15 }),
    body.body("email").isEmail().normalizeEmail(),
    body.body("profileImage"),
    body.body("facebookAddress").notEmpty(),
    body.body("twitterAddress").notEmpty(),
    body.body("instagramAddress").notEmpty(),
    body.body('profileImage').trim()
  ];
}

function storyValidatin() {
  return [
    body.body("title").notEmpty().trim().isLength({ min: 3 }),
    body.body("body").notEmpty().trim().isLength({ min: 3 }),
    body.body("status").notEmpty().trim().isLength({ min: 6 }),
    body.body('backgroundImageUrl').trim()
  ];
}

function commentValidation() {
  return [
    body.body("storyId").notEmpty().isLength({ min: 23 }),
    body.body("commentBody").notEmpty().trim().isLength({ min: 3 }),
  ];
}





const validateErrors = (req, res, next) => {
  // console.log(req.body);
  const errors = validationResult.validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }else{
    if(req.file !== undefined){
        const filePath = path.join('./',req.file.path);
      (async function(path){
        try{
          await unlink(path); // removing file
        }catch(err){
         // error occured
          throw new Error(err);
         
        }
      })(filePath);
    }

    res.status(422).json(errors);
  }

};

export {
  userRegisterValidation,
  userProfileValidation,
  validateErrors,
  storyValidatin,
  commentValidation,
};







  // if(existsSync(path)){
  //   console.log('file exist');
  //   try{
  //     await unlink(path);
  //     console.log('file removed successfully')
  //   }catch(err){
  //     console.error('there was an error: ',err);
  //   }
  // }
  // access(path,async (err)=>{
  //   if(err){
  //     console.log('the file does not exist')
  //   }else{
  //     try{
  //       await unlink(path);
  //       console.log('file removed successfully')
  //     }catch(err){
  //       console.error('there was an error: ',err);
  //     }
  //   }
  // })