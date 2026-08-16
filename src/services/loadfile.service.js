import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { EPubLoader } from "@langchain/community/document_loaders/fs/epub";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { getFileExtension } from "../Utils/extensionchecker.js";

const loaderFactories = {
  ".pdf": (filepath) => new PDFLoader(filepath, { parsedItemSeparator: "" }),
  ".docx": (filepath) => new DocxLoader(filepath, { parsedItemSeparator: "" }),
  ".epub": (filepath) => new EPubLoader(filepath, { parsedItemSeparator: "" }),
  ".txt": (filepath) => new TextLoader(filepath),
  ".csv": (filepath) => new CSVLoader(filepath),
};

const supportedExtensions = Object.keys(loaderFactories);

export default async function loadFile(filepath) {
  try {
    const extension = getFileExtension(filepath);
    const factory = loaderFactories[extension];
    if (!factory) {
      throw new Error(
        `Unsupported file extension: ${extension}. Supported: ${supportedExtensions.join(
          ", "
        )}`
      );
    }
    const loader = factory(filepath);
    const docs = await loader.load();
    console.log(`📄 Loaded ${docs.length} pages from: ${filepath}`);
    return docs;
  } catch (error) {
    console.error(`Error loading file: ${error}`);
    throw new Error(`Error loading file: ${error}`);
  }
}
