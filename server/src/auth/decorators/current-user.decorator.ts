import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../db/models/user.model';

export const CurrentUser = createParamDecorator(
  (_data: keyof User | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);


