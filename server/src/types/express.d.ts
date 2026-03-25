import 'express';

declare global {
  namespace Express {
    interface Request {
      offerFiles?: {
        preview?: Express.Multer.File;
        files: Express.Multer.File[];
      };
    }
  }
}