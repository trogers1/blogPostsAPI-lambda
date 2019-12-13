const assert = require('assert');

const {
  formatDatabaseError,
  formatInternalError,
  formatNotFoundError,
  formatBadRequestError,
  parseBlogPost
} = require('../../utils');
const { slugify } = require('../../helpers/slugify');
const { truncate } = require('../../helpers/truncate');

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

describe('helpers:', () => {
  describe('- slugify()', () => {
    describe('-> Provided A Normal Sentence, No Special Characters', () => {
      it('should return a properly-slugified string', () => {
        assert.strictEqual(slugify('This is a string.'), 'this-is-a-string');
      });
    });
    describe('-> Provided A Normal Sentence, With Special Characters', () => {
      it('should return a properly-slugified string', () => {
        assert.strictEqual(
          slugify('Mr. `Gorbachev`, tear down $%^thI$$s wall!'),
          'mr-gorbachev-tear-down-this-wall'
        );
      });
    });
    describe('-> Provided A Weird String With Special Characters', () => {
      it('should return a properly-slugified string', () => {
        assert.strictEqual(
          slugify('## wh(*))-at d*&#_)i(*D )O((*U Y00OU s12312;a31230y?'),
          'wh-at-d_id-ou-y00ou-s12312a31230y'
        );
      });
    });
  });

  describe('- truncate()', () => {
    describe('-> Provided A Normal Sentence, No Special Characters, Max Char Is Between Words', () => {
      it('should return a properly-truncated string', () => {
        assert.strictEqual(truncate('This is a string.', 10), 'This is a…');
      });
    });
    describe('-> Provided A Normal Sentence, With Special Characters, Max Char Is Between Words', () => {
      it('should return a properly-truncated string', () => {
        assert.strictEqual(
          truncate(
            '“History will be kind *(_)#to me for I intend to write it.” - Winston S. Churchill',
            58
          ),
          '“History will be kind *(_)#to me for I intend to write it…'
        );
      });
    });
    describe('-> Provided A Normal Sentence, With Special Characters, Max Char Is In A Word', () => {
      it('should return a properly-truncated string', () => {
        assert.strictEqual(
          truncate(
            '“History will be kind *(_)#to me for I intend to write it.” - Winston S. Churchill',
            70
          ),
          '“History will be kind *(_)#to me for I intend to write it.” - Winston…'
        );
      });
    });
    describe('-> Provided a string of only newlines', () => {
      it('should return an empty string', () => {
        assert.strictEqual(truncate('\n\n\n\n', 20), '');
      });
    });
    describe('-> Provided A Normal Sentence, With Special Characters, Max Char Is Longer Than The String', () => {
      it('should return the string, unmolested', () => {
        assert.strictEqual(
          truncate(
            'The most effective way to destroy peo(&&__+_ple is to deny and obliterate their o)))*&&_-_wn understanding of their history.” ― George Orwell',
            250
          ),
          'The most effective way to destroy peo(&&__+_ple is to deny and obliterate their o)))*&&_-_wn understanding of their history.” ― George Orwell'
        );
      });
    });
    describe('-> Provided A Normal Sentence, With Newline Characters, Max Char Is In A Word', () => {
      it('should return a properly-truncated string, with newlines replaced by spaces', () => {
        assert.strictEqual(
          truncate('“The first duty of a man is to think for himself”\n― Jose Marti\n', 60),
          '“The first duty of a man is to think for himself” ― Jose…'
        );
      });
    });

    describe('-> Provided A Normal Sentence, With Newline Characters, Max Char Is Longer Than The String', () => {
      it('should return the string, unmolested, with newlines replaced by spaces, except at the end of the string', () => {
        assert.strictEqual(
          truncate(
            '“Remember, remember always, that all of us, and you and I especially, are descended from immigrants and revolutionists.”\n― Franklin D. Roosevelt\n',
            600
          ),
          '“Remember, remember always, that all of us, and you and I especially, are descended from immigrants and revolutionists.” ― Franklin D. Roosevelt'
        );
      });
    });
  });
});
