const multer = require("multer");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// const uploadFileToCloudinary = (file) => {
//   const options = {
//     resource_type: file.mimetype.startsWith("video") ? "video" : "image",
//   };

//   return new Promise((resolve, reject) => {
//     if (file.mimetype.startsWith("video")) {
//       cloudinary.uploader.upload_large(file.path, options, (error, result) => {
//         if (error) {
//           return reject(error);
//         }
//         resolve(result);
//       });
//     } else {
//       cloudinary.uploader.upload(file.path, options, (error, result) => {
//         if (error) {
//           return reject(error);
//         }
//         resolve(result);
//       });
//     }
//   });
// };

// const multerMiddleware = multer({ dest: "uploads/" });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const multerMiddleware = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|gif|mp4|mov|webm/;
    const mimetype = fileTypes.test(file.mimetype);
    const extname = fileTypes.test(file.originalname);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Invalid file type. Only image and video files are allowed."));
  },
});

const uploadFileToCloudinary = (file) => {
  const options = {
    resource_type: file.mimetype.startsWith("video") ? "video" : "image",
  };

  return new Promise((resolve, reject) => {
    if (file.mimetype.startsWith("video")) {
      // Use upload_large for video files
      cloudinary.uploader.upload_large(file.path, options, (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      });
    } else {
      // Standard upload for images
      cloudinary.uploader.upload(file.path, options, (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      });
    }
  });
};

module.exports = { multerMiddleware, uploadFileToCloudinary };
