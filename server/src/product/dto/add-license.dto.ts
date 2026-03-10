import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class AddLicenseDto {
  @IsNumber({}, { message: 'License type ID must be a number' })
  @IsNotEmpty({ message: 'License type ID is required' })
  licenseTypeId: number;

  @IsNumber({}, { message: 'Price must be a number' })
  @IsNotEmpty({ message: 'Price is required' })
  @Min(0)
  price: number;
}
