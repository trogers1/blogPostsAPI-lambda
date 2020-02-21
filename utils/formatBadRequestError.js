/**
 * 400 Bad Request, Error Handler. Can be given an already-formatted error,
 * or an object with a message property to be formatted correctly for our
 * response.
 * @param {object}  error An object with a `message` property, OR an already-formatted error
 * @returns A formatted error response
 */
module.exports.formatBadRequestError = error => {
  if (error.statusCode && error.headers && error.body && JSON.parse(error.body).errors) {
    return error;
  }
  console.error(`Your request was malformed: ${error.message}.`);
  console.error(error);
  return {
    statusCode: 400,
    headers: {
      'Content-Type': 'application/vnd.api+json; charset=utf-8'
    },
    body: JSON.stringify({
      errors: [
        {
          status: 400,
          title: 'Bad Request',
          detail: `Your request was malformed: ${error.message}.`
        }
      ]
    })
  };
};
