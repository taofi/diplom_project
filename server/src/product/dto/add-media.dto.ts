import { IsNotEmpty, IsString, IsOptional, IsNumber, IsBoolean, IsEnum } from 'class-validator';
import { MediaType } from '../../db/models/product-media.model';

export class AddMediaDto {
  @IsString({ message: 'URL must be a string' })
  @IsNotEmpty({ message: 'URL is required' })
  url: string;

  @IsEnum(MediaType, { message: 'Media type must be image or video' })
  @IsOptional()
  mediaType?: MediaType = MediaType.IMAGE;

  @IsBoolean({ message: 'Is cover must be a boolean' })
  @IsOptional()
  isCover?: boolean = false;

  @IsNumber({}, { message: 'Sort order must be a number' })
  @IsOptional()
  sortOrder?: number = 0;
}


