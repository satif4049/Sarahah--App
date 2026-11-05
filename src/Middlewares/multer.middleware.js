import multer from "multer";
import fs from "node:fs"
import crypto from "node:crypto"
import { allowedExtension } from "../Common/Enum/user.enum.js";
import { ApplicationException } from "../Utils/Security/ErrorException/error.exception.js";


export const multerUpload = ({desiredPath})=>{
    // validate if destination is exist
    const fullDestination = `uplouds/${desiredPath}`;
    if (!fs.existsSync(fullDestination)) {
        fs.mkdirSync(fullDestination , {recursive:true})
    }
// storage section [diskStorage]
    const storage = multer.diskStorage({
      destination: function (req, file, cp) {
        cp(null , fullDestination)
      },

      filename: function (req, file, cp) {
        const suffix = crypto.randomBytes(16).toString("hex") + Date.now();
        cp(null , `${suffix} ___ ${file.originalname}`)
      },
    });

    const fileFilter = function(req , file , cp){
        const [ fileType, inputFileExtension  ] = file.mimetype.split("/")
        console.log({allowedExtension , fileType , inputFileExtension});
        
        const fileExtension = allowedExtension[fileType];
       
        console.log({
          ext: fileExtension,
          cond: fileExtension.includes(inputFileExtension),
        });
        
        if (fileExtension.includes(inputFileExtension)) {
          cp(null, true);
        } else {
          cp(
             ApplicationException({ message: "Invalid File Extension" }),
            false,
          );
        }

    }

    return multer({fileFilter , storage})
}