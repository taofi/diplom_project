import { Controller, Get, Query } from '@nestjs/common';
import { AuthorsService } from './authors.service';
import { GetAuthorsQueryDto } from './dto/get-authors-query.dto';

@Controller('authors')
export class AuthorsController {
  constructor(private readonly authorsService: AuthorsService) {}

  @Get()
  async findAll(@Query() query: GetAuthorsQueryDto) {
    return this.authorsService.findAll(query);
  }
}

