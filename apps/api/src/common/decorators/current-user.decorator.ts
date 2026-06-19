import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../entities/user.entity';

export const CurrentUser = createParamDecorator(
  (field: keyof User | undefined, ctx: ExecutionContext) => {
    const user: User = ctx.switchToHttp().getRequest().user;
    return field ? user?.[field] : user;
  },
);
