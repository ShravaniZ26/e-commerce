'use strict';

/**
 * Generic Joi validation middleware factory.
 *
 * @param {import('joi').ObjectSchema} schema - Joi schema to validate against.
 * @param {'body'|'query'|'params'} [source='body'] - Which part of the request
 *   to validate.
 * @returns {Function} Express middleware
 *
 * @example
 * router.post('/register', validate(registerSchema), authController.register);
 * router.get('/users', validate(listQuerySchema, 'query'), userController.list);
 */
function validate(schema, source = 'body') {
  return function validationMiddleware(req, res, next) {
    const data = req[source];

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(422).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'The request data is invalid.',
        details,
      });
    }

    // Replace the request property with the coerced, stripped value.
    req[source] = value;
    return next();
  };
}

module.exports = validate;
