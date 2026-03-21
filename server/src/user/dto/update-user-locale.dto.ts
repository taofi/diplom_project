import { IsString, IsLocale } from 'class-validator';

export class UpdateUserLocaleDto {
  @IsString({ message: 'Locale must be a string' })
  @IsLocale({ message: 'Locale must be a valid locale' })
  locale: string;
}
