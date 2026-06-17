


export interface FileUploadResult {
  filename: string;
  originalName: string;
  path: string;
  url: string;
  size: number;
  mimeType: string;
}


export interface FileDeleteResult {
  success: boolean;
  deletedPath?: string;
}


export interface MulterFile {
  originalname: string;
  buffer?: Buffer;
  size: number;
  mimetype: string;
  
  path?: string;
  
  filename?: string;
}


export interface FileInfo {
  size: number;
  createdAt: Date;
}


export enum MediaFolder {
  PRODUCT = 'product',
  TEMP = 'temp',
  OFFERS = 'offers',
  CHAT = 'chat',
}


export enum FileFolder {
  PRODUCT = 'product',
  TEMP = 'temp',
  OFFERS = 'offers',
}


export enum FileType {
  MEDIA = 'media',
  FILE = 'file',
}


export interface SavePathOptions {
  type: FileType;
  folder: MediaFolder | FileFolder;
  entityId?: number;
  userId: number;
}


export interface MoveProductFilesResult {
  media: FileUploadResult[];
  file: FileUploadResult | null;
}


export interface TempFile {
  url: string;
  originalName: string;
  size: number;
  mimeType: string;
}


