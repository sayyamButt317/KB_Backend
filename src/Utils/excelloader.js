import XLSX from "xlsx"; 
import { Document } from "@langchain/core/documents";
import path from "path";

export async function loadExcelAsDocuments(filePath) {
  const workbook = XLSX.readFile(filePath);
  const docs= [];

  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

     rows.forEach((row, index) => {
      const content = row.join(" | ");
      const doc = new Document({
        pageContent: content,
        metadata: {
          sheet: sheetName,
          row: index + 1,
          source: path.basename(filePath),
        },
      });
      docs.push(doc);
    });
  });

  return docs;
}
export default loadExcelAsDocuments;