import express from "express";
import { TextToSpeech } from "../controllers/Voice/tts.controller.js";
import {UploadFile} from "../controllers/Embedding/File/upload-file.controller.js";
import { upload } from "../Config/multer.config.js";
import VideoGenerator from "../controllers/Video/VideoGenerator.controller.js";
import CreateVectorEmbedding from "../controllers/Embedding/File/vector-embedding.controller.js";
import { UploadFolder } from "../controllers/Embedding/Folder/upload-folder.queue.js";
import DirectoryEmbedding from "../controllers/Embedding/Folder/directory-embedding.controller.js";
import { GetAllDocs } from "../controllers/collection/doc.controller.js";
import registerController from "../controllers/user/user.controller.js";
import loginController from "../controllers/user/user.controller.js";


const router = express.Router(); 
// AI Routes
router.post("/upload/file", upload.single("file"), UploadFile);
router.post("/upload/folder", upload.array("files", 100), UploadFolder);
router.get("/chat", CreateVectorEmbedding,DirectoryEmbedding);
router.get("/collections", GetAllDocs);

router.post("/text", TextToSpeech);

// User Routes
router.post("/register", registerController);
router.post("/login", loginController);

// router.post("/video-prompt", VideoGenerator);

export default router;
