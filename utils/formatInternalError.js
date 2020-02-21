/**
 * 500 Internal Server Error, Error Handler. Can be given an already-formatted error,
 * or an object with a message property to be formatted correctly for our
 * response.
 * @param {object}  error An object with a `message` property, OR an already-formatted error
 * @returns A formatted error response
 */
module.exports.formatInternalError = error => {
  if (error.statusCode && error.headers && error.body && JSON.parse(error.body).errors) {
    return error;
  }
  console.error(`An internal server error occurred: ${error.message}.`);
  console.error(error);
  return {
    statusCode: 500,
    headers: {
      'Content-Type': 'application/vnd.api+json; charset=utf-8'
    },
    body: JSON.stringify({
      errors: [
        {
          status: 500,
          title: 'Internal Server Error',
          detail: `An internal server error occurred: ${error.message}.`
        }
      ]
    })
  };
};
