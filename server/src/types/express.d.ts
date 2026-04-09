import 'express';

declare global {
  namespace Express {
    interface Request {
      offerFiles?: {
        images?: Express.Multer.File[];
        files?: Express.Multer.File[];
        file?: Express.Multer.File;
        preview?: Express.Multer.File;
      };
      chatFiles?: Express.Multer.File[];
    }
  }
}