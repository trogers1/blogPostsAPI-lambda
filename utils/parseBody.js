'use strict';

const { formatBadRequestError } = require('./formatBadRequestError');

/**
 * The parseBody function accepts a JSON request body and attempts to parse it into javascript using JSON.parse().
 * If successful, the function will return the parsed javascript object.
 * If the parsing fails, the function will return a JSONAPI formatted error response which can be sent back to the client with the callback function.
 * @param {string} body - A JSON formatted request body string
 * @returns {object} A javascript object.
 */
module.exports.parseBody = body => {
  try {
    let parsedBody = JSON.parse(body);
    return parsedBody;
  } catch (error) {
    throw formatBadRequestError({
      message:
        'The request body is invalid, and was unable to be parsed. Please check the JSON format of your request body'
    });
  }
};
