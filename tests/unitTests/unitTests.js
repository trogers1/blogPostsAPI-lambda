const assert = require('assert');

const {
  formatDatabaseError,
  formatInternalError,
  formatNotFoundError,
  formatBadRequestError
} = require('../../utils');

describe('utils:', () => {
  describe('- formatDatabaseError()', () => {
    describe('-> Provided Unformatted Error', () => {
      it('should return a properly-formatted error response when passed an error', () => {
        const error = { message: 'This is a db error message.' };
        const expectedResponse = {
          statusCode: 500,
          headers: {
            'Content-Type': 'application/vnd.api+json; charset=utf-8'
          },
          body: JSON.stringify({
            errors: [
              {
                status: 500,
                title: 'Database Error',
                detail: `A database error occured: ${error.message}.`
              }
            ]
          })
        };
        assert.deepStrictEqual(formatDatabaseError(error), expectedResponse);
      });
    });
    describe('-> Provided Formatted Error', () => {
      it('should return the formatted error response untouched when passed an already-formatted error', () => {
        const error = { message: 'This is an internal error message' };
        assert.deepStrictEqual(
          formatDatabaseError(formatInternalError(error)),
          formatInternalError(error)
        );
      });
    });
  });

  describe('- formatInternalError()', () => {
    describe('-> Provided Unformatted Error', () => {
      it('should return a properly-formatted error response when passed an error', () => {
        const error = { message: 'This is an internal error message.' };
        const expectedResponse = {
          statusCode: 500,
          headers: {
            'Content-Type': 'application/vnd.api+json; charset=utf-8'
          },
          body: JSON.stringify({
            errors: [
              {
                status: 500,
                title: 'Internal Server Error',
                detail: `An internal server error occured: ${error.message}.`
              }
            ]
          })
        };
        assert.deepStrictEqual(formatInternalError(error), expectedResponse);
      });
    });
    describe('-> Provided Formatted Error', () => {
      it('should return the formatted error response untouched when passed an already-formatted error', () => {
        const error = { message: 'This is a db error message' };
        assert.deepStrictEqual(
          formatInternalError(formatDatabaseError(error)),
          formatDatabaseError(error)
        );
      });
    });
  });

  describe('- formatNotFoundError()', () => {
    describe('-> Provided Unformatted Error', () => {
      it("should return a properly-formatted error response when passed the id of a resource that couldn't  be found in the database", () => {
        const error = { message: '1234' };
        const expectedResponse = {
          statusCode: 404,
          headers: {
            'Content-Type': 'application/vnd.api+json; charset=utf-8'
          },
          body: JSON.stringify({
            errors: [
              {
                status: 404,
                title: 'Resource Not Found',
                detail: `Unable to find the resource: ${error.message}.`
              }
            ]
          })
        };
        assert.deepStrictEqual(formatNotFoundError(error), expectedResponse);
      });
    });
    describe('-> Provided Formatted Error', () => {
      it('should return the formatted error response untouched when passed an already-formatted error', () => {
        const error = { message: 'This is a db error message' };
        assert.deepStrictEqual(
          formatNotFoundError(formatBadRequestError(error)),
          formatBadRequestError(error)
        );
      });
    });
  });

  describe('- formatBadRequestError()', () => {
    describe('-> Provided Unformatted Error', () => {
      it('should return a properly-formatted error response when a bad request is made to the API', () => {
        const error = { message: 'Testing a message' };
        const expectedResponse = {
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
        assert.deepStrictEqual(formatBadRequestError(error), expectedResponse);
      });
    });
    describe('-> Provided Formatted Error', () => {
      it('should return the formatted error response untouched when passed an already-formatted error', () => {
        const error = { message: 'This is a db error message' };
        assert.deepStrictEqual(
          formatBadRequestError(formatNotFoundError(error)),
          formatNotFoundError(error)
        );
      });
    });
  });
});
