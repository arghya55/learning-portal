import multer from "multer";
import fs from "fs";
import path from "path";

const uploadDir =
  path.join(
    process.cwd(),
    "uploads",
    "videos"
  );


// Create upload directory

if (!fs.existsSync(uploadDir)) {

  fs.mkdirSync(
    uploadDir,
    {
      recursive: true
    }
  );

}


const storage =
  multer.diskStorage({

    destination: (
      req,
      file,
      cb
    ) => {

      cb(
        null,
        uploadDir
      );

    },


    filename: (
      req,
      file,
      cb
    ) => {

      const ext =
        path.extname(
          file.originalname
        );

      const baseName =
        path
          .basename(
            file.originalname,
            ext
          )
          .replace(
            /[^a-zA-Z0-9-_]/g,
            "_"
          );

      const uniqueName =
        `${baseName}-${Date.now()}${ext}`;

      cb(
        null,
        uniqueName
      );

    }

  });


const fileFilter =
  (
    req,
    file,
    cb
  ) => {

    const allowedTypes = [

      "video/mp4",

      "video/webm",

      "video/ogg",

      "video/quicktime"

    ];


    if (
      allowedTypes.includes(
        file.mimetype
      )
    ) {

      cb(
        null,
        true
      );

    } else {

      cb(
        new Error(
          "Only MP4, WebM, OGG and MOV videos are allowed"
        )
      );

    }

  };


export const uploadVideo =
  multer({

    storage,

    fileFilter,

    limits: {

      fileSize:
        500 * 1024 * 1024

    }

  });