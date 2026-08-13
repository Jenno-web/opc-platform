import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { AuthPayload } from './jwt-auth.guard';

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthPayload => {
  const request = ctx.switchToHttp().getRequest<Request & { user: AuthPayload }>();
  return request.user;
});
