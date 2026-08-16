import multer from "multer";
import path from "path";
import fs from "fs";

const uploadPath = path.resolve("uploads");

if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create a unique subdirectory for folder uploads so we can process all files together
    if (file.fieldname === "files") {
      if (!req.uploadDir) {
        const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const dir = path.join(uploadPath, "folder", unique.toString());
        fs.mkdirSync(dir, { recursive: true });
        req.uploadDir = dir;
      }
      return cb(null, req.uploadDir);
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

export const upload = multer({ storage });
