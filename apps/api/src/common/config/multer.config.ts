import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';

export const imageMulterOptions: MulterOptions = {
  storage: memoryStorage(),
  limits: { fileSize: 1 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!file.mimetype.startsWith('image/')) {
      return callback(new BadRequestException('Only image files are allowed'), false);
    }
    callback(null, true);
  },
};
