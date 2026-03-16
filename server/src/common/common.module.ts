import { Module, Global } from '@nestjs/common';
import { FileService } from './services/file.service';

@Global()
@Module({
  providers: [FileService],
  exports: [FileService],
})
export class CommonModule {}
