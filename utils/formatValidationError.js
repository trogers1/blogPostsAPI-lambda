/**
 * 400 Validation Error, Error Handler. Can be given an already-formatted error,
 * or a jsonschema.validator error object to be formatted correctly for our
 * response.
 * @param {object}  error A jsonschema.validator error, OR an already-formatted error
 * @returns A formatted error response
 */
module.exports.formatValidationError = error => {
  if (error.statusCode && error.headers && error.body && JSON.parse(error.body).errors) {
    return error;
  }
  return {
    statusCode: 400,
    headers: {
      'Content-Type': 'application/vnd.api+json; charset=utf-8'
    },
    body: JSON.stringify({
      errors: error.map(err => {
        let detail;
        if (err.name === 'additionalProperties') {
          detail = `'${err.argument}' is an invalid attribute.`;
        } else {
          let errorMessage = err.stack.replace('instance.', '');
          detail = `Attribute ${errorMessage.replace(/"/g, "'")}`;
        }
        console.error(`Validation error: ${detail}`);
        return {
          status: 400,
          title: 'Invalid Attribute',
          detail
        };
      })
    })
  };
};
