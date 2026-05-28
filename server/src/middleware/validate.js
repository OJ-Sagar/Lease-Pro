import { HttpError } from './error.js';

export function validate(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query
    });

    if (!result.success) {
      next(new HttpError(422, 'Validation failed', result.error.flatten()));
      return;
    }

    req.validated = result.data;
    next();
  };
}
