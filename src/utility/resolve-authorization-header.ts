import { Context } from 'koa';

export function resolveAuthorizationHeader(ctx: Context, { passthrough = false }: { passthrough?: boolean } = {}) {
  if (!ctx.headers || !ctx.headers.Authorization) {
    return;
  }

  const parts = ctx.headers.Authorization.split(' ');

  if (parts.length === 2) {
    const scheme = parts[0];
    const credentials = parts[1];

    if (/^Bearer$/i.test(scheme)) {
      return credentials;
    }
  }
  if (!passthrough) {
    ctx.throw(401, 'Bad Authorization header format. Format is "Authorization: Bearer <token>"');
  }
}
