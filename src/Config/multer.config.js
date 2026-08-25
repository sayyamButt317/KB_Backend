import multer from "multer";
import path from "path";
import fs from "fs";

const uploadRoot = path.resolve("uploads");

if (!fs.existsSync(uploadRoot)) fs.mkdirSync(uploadRoot);

function companyBaseDir(req) {
  const companyId = req.user?.companyId;
  if (!companyId) {
    throw new Error("Missing companyId on request; auth middleware required before upload");
  }
  return path.join(uploadRoot, String(companyId));
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    try {
      const base = companyBaseDir(req);

      if (file.fieldname === "files") {
        if (!req.uploadDir) {
          const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
          const dir = path.join(base, "folder", unique.toString());
          fs.mkdirSync(dir, { recursive: true });
          req.uploadDir = dir;
        }
        return cb(null, req.uploadDir);
      }

      fs.mkdirSync(base, { recursive: true });
      return cb(null, base);
    } catch (error) {
      return cb(error);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

export const upload = multer({ storage });
