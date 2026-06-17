import { createParamDecorator, ExecutionContext } from '@nestjs/common';

interface AuthRequest {
  user?: { id: number };
}

export const CurrentUserId = createParamDecorator(
  (_data: undefined, ctx: ExecutionContext): number | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.id;
  },
);


