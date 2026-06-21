import { BadRequestException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { diskStorage } from 'multer';
import type { Request } from 'express';

export const UPLOADS_DIR = join(process.cwd(), 'uploads');
export const UPLOADS_PUBLIC_PREFIX = '/uploads';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const productImageMulterOptions = {
  storage: diskStorage({
    destination: (_req, _file, cb) => {
      if (!existsSync(UPLOADS_DIR)) {
        mkdirSync(UPLOADS_DIR, { recursive: true });
      }
      cb(null, UPLOADS_DIR);
    },
    filename: (_req, file: Express.Multer.File, cb) => {
      const uniqueName = `${Date.now()}-${randomBytes(8).toString('hex')}${extname(
        file.originalname,
      ).toLowerCase()}`;
      cb(null, uniqueName);
    },
  }),
  fileFilter: (
    _req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(
        new BadRequestException(
          `Unsupported file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
        ),
        false,
      );
      return;
    }
    cb(null, true);
  },
  limits: { fileSize: MAX_FILE_SIZE },
};
