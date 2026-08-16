
import path from 'path'

export function getFileExtension(filepath) {
  return path.extname(filepath).toLowerCase();
}

