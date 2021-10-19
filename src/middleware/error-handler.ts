import { Middleware } from 'koa';
import { NotFound } from '../errors/not-found';
import { RequestError } from '../errors/request-error';
import { ServerError } from '../errors/server-error';
import { NotFoundError, SlonikError } from 'slonik';
import { Forbidden } from '../errors/forbidden';

export const errorHandler: Middleware = async (context, next) => {
  try {
    await next();
  } catch (err) {
    if (process.env.NODE_ENV === 'test') {
      console.log((err as Error).toString());
    }

    if (err instanceof RequestError) {
      context.response.body = { error: err.message };
      context.status = 400;
    } else if (err instanceof ServerError) {
      context.response.status = 500;
    } else if (err instanceof NotFound) {
      if (err.message) {
        context.response.body = { error: err.message };
      }
      context.response.status = 404;
    } else if (err instanceof Forbidden) {
      context.response.status = 403;
    } else if (err instanceof NotFoundError) {
      context.response.status = 404;
    } else if (err instanceof SlonikError) {
      console.log(err);
      context.response.status = 404;
    } else {
      console.log('Unhandled error');
      console.log(err);
      context.response.status = 500;
    }
  }
};
