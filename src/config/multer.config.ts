import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';

export const multerConfig: MulterOptions = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = './uploads';
      if (!existsSync(uploadDir)) {
        mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const fileExtension = extname(file.originalname);
      const filename = `${file.fieldname}-${uniqueSuffix}${fileExtension}`;
      cb(null, filename);
    },
  }),
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, PNG, and JPEG files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 10,
  },
};