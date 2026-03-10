import { createParamDecorator, ExecutionContext } from '@nestjs/common';

interface AuthRequest {
  user?: { sub: number };
}

export const CurrentUserId = createParamDecorator(
  (_data: undefined, ctx: ExecutionContext): number | undefined => {
    const request = ctx.switchToHttp().getRequest() as AuthRequest;
    return request.user?.sub;
  },
);
