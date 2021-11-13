import {constants,access  } from 'fs';
import {unlink} from 'fs/promises';
import path from 'path';
import multer from "multer";
// for deleting images from any where
function ImageDelete(path){
    access(path,constants.F_OK,async (err)=>{
      if(err){
        console.log('there was an error: ',err)
        return;
      }
      await unlink(path);
      // console.log('Profile image removes successfylly.')
    })
}

// for multer 
function fileFilter(req, file, cb){
  let extExpression = /jpg|jpeg|png|gif/;
  let fileExt = extExpression.test(
    path.extname(file.originalname).toLocaleLowerCase()
  );

  let mimeType = extExpression.test(file.mimetype);
  if (fileExt && mimeType) {
    cb(null, true);
  } else {
    cb("the given file type  is not supported", false);
  }
};

function mv(upload) {
  return (req, res, next) => {
    upload(req, res, async function (err) {
      if (err instanceof multer.MulterError) {
        return res.status(415).json({ message: err });
      } else if (err) {
        // console.log(err);
        return res.status(415).json({ message: err });
      }
      next();
    });
  };
}

function Storage(folderName){
  return multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, `uploads/${folderName}`);
    },
    filename: function (req, file, cb) {
      cb(
        null,
        file.fieldname + "-" + Date.now() + path.extname(file.originalname)
      );
    },
  });
}
// let storage = 

export {
    ImageDelete,
    fileFilter,
    mv,
    Storage
}