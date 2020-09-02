const assert = require('assert');
const Ajv = require('ajv');
const ajv = new Ajv({ allErrors: true });

const {
  formatDatabaseError,
  formatInternalError,
  formatNotFoundError,
  formatBadRequestError,
  formatValidationError,
  parseBlogPost
} = require('../../utils');
const { slugify } = require('../../helpers/slugify');
const { truncate } = require('../../helpers/truncate');
const blogPostPatchSchema = require('../../requestSchemas/blogPostPatchSchema.json');

describe('utils:', () => {
  describe('- formatValidationError()', () => {
    describe('-> Provided Unformatted Error', () => {
      it('Should return a properly-formatted error response when passed an array of schema validation errors', () => {
        const exampleBody = {
          additionalProperty: 'true',
          data: {
            type: 'not a valid blog pst',
            additionalProperty: true,
            attributes: {
              title: 'a blog post title',
              previewText: 'a preview text',
              tags: ['tag1', 1],
              additionalProperty: true,
              type: 3
            }
          }
        };
        let valid = ajv.validate(blogPostPatchSchema, exampleBody);
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
                detail: '->additionalProperty is an invalid attribute.'
              },
              {
                status: 400,
                title: 'Bad Request',
                detail: '->data->additionalProperty is an invalid attribute.'
              },
              {
                status: 400,
                title: 'Bad Request',
                detail: '->data->type should match pattern "^blogPost$".'
              },
              {
                status: 400,
                title: 'Bad Request',
                detail: "->data should have required property 'id'."
              },
              {
                status: 400,
                title: 'Bad Request',
                detail: '->data->attributes->additionalProperty is an invalid attribute.'
              },
              {
                status: 400,
                title: 'Bad Request',
                detail: '->data->attributes->tags[1] should be string.'
              },
              {
                status: 400,
                title: 'Bad Request',
                detail: '->data->attributes->type should be string.'
              }
            ]
          })
        };
        assert(!valid, 'Schema should be invalid, but was found to be valid.');
        assert.deepStrictEqual(
          // Do this so it's easier to see exactly where the difference is.
          JSON.parse(formatValidationError(ajv.errors).body),
          JSON.parse(expectedResponse.body)
        );
        assert.deepStrictEqual(formatValidationError(ajv.errors), expectedResponse);
      });
    });
    describe('-> Provided Formatted Error', () => {
      it('Should return the formatted error response untouched when passed an already-formatted error', () => {
        const error = { message: 'This is an internal error message' };
        assert.deepStrictEqual(
          formatValidationError(formatInternalError(error)),
          formatInternalError(error)
        );
      });
    });
  });

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
                detail: `A database error occurred: ${error.message}.`
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
                detail: `An internal server error occurred: ${error.message}.`
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

  describe('- parseBlogPost()', () => {
    describe('-> Provided An Average MD, it should return the appropriate metadata and prepend a Table of Contents', () => {
      let exampleBody =
        '\r\n' +
        'Content-Disposition: form-data; name=""; filename="Steps.md"\r\n' +
        'Content-Type: text/markdown\r\n' +
        '\r\n' +
        '# Creating a Serverless API with Mongo, Docker, and Codeship\n' +
        '\n' +
        "This article is a real doozy. I'm going to walk you through creating a RESTful Serverless AWS Lambda API running Node. We'll create an example API to handle blog posts, specifically the following:\n" +
        '\n' +
        '- `GET` all blog posts\n' +
        '- `GET` specific posts by id\n' +
        '- `POST` to create a new blog post\n' +
        '- `PATCH` to edit a blog post\n' +
        '- `DELETE` to delete a blog post\n' +
        '\n' +
        "Create a repo using your version control software and let's get started.\n" +
        '\n' +
        '## `npm init`\n' +
        '\n' +
        'Using `npm init`, answer the questions. After generating the `package.json`, edit it by removing the `"main"` line, since we won\'t have a main entrance to our API.\n' +
        '\n' +
        '## Get Workspace ready\n' +
        '\n' +
        '### Install Dependencies\n' +
        '\n' +
        "Firstly, we'll install all dependencies. Both devDependencies and full dependencies.\n" +
        '\n' +
        '**devDependencies**\n' +
        '\n' +
        '```\n' +
        '$ npm i dredd eslint hooks mocha nodemon prettier serverless serverless-offline --save-dev\n' +
        '```\n' +
        '\n' +
        '**dependencies**\n' +
        '\n' +
        '```\n' +
        '$ npm i json-api-serializer ajv mongoose papaparse query-string\n' +
        '```\n' +
        '\n' +
        '### Create Dot Files\n' +
        '\n' +
        'Now, we need the dot files to get our workspace working correctly. Create the following files (examples can be found in the `examples/dotFiles`[LINK_NEEDED] directory).\n' +
        '\n';
      let expectedResultBody =
        "This article is a real doozy. I'm going to walk you through creating a RESTful Serverless AWS Lambda API running Node. We'll create an example API to handle blog posts, specifically the following:\n" +
        '\n' +
        '- `GET` all blog posts\n' +
        '- `GET` specific posts by id\n' +
        '- `POST` to create a new blog post\n' +
        '- `PATCH` to edit a blog post\n' +
        '- `DELETE` to delete a blog post\n' +
        '\n' +
        "Create a repo using your version control software and let's get started.\n" +
        '\n' +
        '## `npm init`\n' +
        '\n' +
        'Using `npm init`, answer the questions. After generating the `package.json`, edit it by removing the `"main"` line, since we won\'t have a main entrance to our API.\n' +
        '\n' +
        '## Get Workspace ready\n' +
        '\n' +
        '### Install Dependencies\n' +
        '\n' +
        "Firstly, we'll install all dependencies. Both devDependencies and full dependencies.\n" +
        '\n' +
        '**devDependencies**\n' +
        '\n' +
        '```\n' +
        '$ npm i dredd eslint hooks mocha nodemon prettier serverless serverless-offline --save-dev\n' +
        '```\n' +
        '\n' +
        '**dependencies**\n' +
        '\n' +
        '```\n' +
        '$ npm i json-api-serializer ajv mongoose papaparse query-string\n' +
        '```\n' +
        '\n' +
        '### Create Dot Files\n' +
        '\n' +
        'Now, we need the dot files to get our workspace working correctly. Create the following files (examples can be found in the `examples/dotFiles`[LINK_NEEDED] directory).\n' +
        '\n';
      let result = parseBlogPost(exampleBody);
      it('should contain the correct metadata: Title', () => {
        assert.strictEqual(
          result.title,
          'Creating a Serverless API with Mongo, Docker, and Codeship'
        );
      });
      it('should contain the correct metadata: blogPostId', () => {
        assert.strictEqual(
          result.blogPostId,
          'creating-a-serverless-api-with-mongo-docker-and-codeship'
        );
      });
      it('should contain the correct metadata: previewText', () => {
        assert.strictEqual(
          result.previewText,
          "This article is a real doozy. I'm going to walk you through creating a RESTful Serverless AWS Lambda API running Node. We'll create an example API to handle blog posts, specifically the following  - GET all blog posts - GET specific posts by id - POST to create a new blog post - PATCH to edit a…"
        );
      });
      it('should contain the correct body, including the table of contents', () => {
        let correctTableOfContents =
          '## Contents\n- [`npm init`](#npm-init)\n- [Get Workspace ready](#get-workspace-ready)\n  - [Install Dependencies](#install-dependencies)\n  - [Create Dot Files](#create-dot-files)\n\n----\n\n';
        assert.strictEqual(result.body, correctTableOfContents + expectedResultBody);
      });
    });
    describe('-> Provided An Average MD, it should return the appropriate metadata when asked NOT to prepend a Table of Contents', () => {
      let exampleBody =
        '\r\n' +
        'Content-Disposition: form-data; name=""; filename="Steps.md"\r\n' +
        'Content-Type: text/markdown\r\n' +
        '\r\n' +
        '# Creating a Serverless API with Mongo, Docker, and Codeship\n' +
        '\n' +
        "This article is a real doozy. I'm going to walk you through creating a RESTful Serverless AWS Lambda API running Node. We'll create an example API to handle blog posts, specifically the following:\n" +
        '\n' +
        '- `GET` all blog posts\n' +
        '- `GET` specific posts by id\n' +
        '- `POST` to create a new blog post\n' +
        '- `PATCH` to edit a blog post\n' +
        '- `DELETE` to delete a blog post\n' +
        '\n' +
        "Create a repo using your version control software and let's get started.\n" +
        '\n' +
        '## `npm init`\n' +
        '\n' +
        'Using `npm init`, answer the questions. After generating the `package.json`, edit it by removing the `"main"` line, since we won\'t have a main entrance to our API.\n' +
        '\n' +
        '## Get Workspace ready\n' +
        '\n' +
        '### Install Dependencies\n' +
        '\n' +
        "Firstly, we'll install all dependencies. Both devDependencies and full dependencies.\n" +
        '\n' +
        '**devDependencies**\n' +
        '\n' +
        '```\n' +
        '$ npm i dredd eslint hooks mocha nodemon prettier serverless serverless-offline --save-dev\n' +
        '```\n' +
        '\n' +
        '**dependencies**\n' +
        '\n' +
        '```\n' +
        '$ npm i json-api-serializer ajv mongoose papaparse query-string\n' +
        '```\n' +
        '\n' +
        '### Create Dot Files\n' +
        '\n' +
        'Now, we need the dot files to get our workspace working correctly. Create the following files (examples can be found in the `examples/dotFiles`[LINK_NEEDED] directory).\n' +
        '\n';
      let expectedResultBody =
        "This article is a real doozy. I'm going to walk you through creating a RESTful Serverless AWS Lambda API running Node. We'll create an example API to handle blog posts, specifically the following:\n" +
        '\n' +
        '- `GET` all blog posts\n' +
        '- `GET` specific posts by id\n' +
        '- `POST` to create a new blog post\n' +
        '- `PATCH` to edit a blog post\n' +
        '- `DELETE` to delete a blog post\n' +
        '\n' +
        "Create a repo using your version control software and let's get started.\n" +
        '\n' +
        '## `npm init`\n' +
        '\n' +
        'Using `npm init`, answer the questions. After generating the `package.json`, edit it by removing the `"main"` line, since we won\'t have a main entrance to our API.\n' +
        '\n' +
        '## Get Workspace ready\n' +
        '\n' +
        '### Install Dependencies\n' +
        '\n' +
        "Firstly, we'll install all dependencies. Both devDependencies and full dependencies.\n" +
        '\n' +
        '**devDependencies**\n' +
        '\n' +
        '```\n' +
        '$ npm i dredd eslint hooks mocha nodemon prettier serverless serverless-offline --save-dev\n' +
        '```\n' +
        '\n' +
        '**dependencies**\n' +
        '\n' +
        '```\n' +
        '$ npm i json-api-serializer ajv mongoose papaparse query-string\n' +
        '```\n' +
        '\n' +
        '### Create Dot Files\n' +
        '\n' +
        'Now, we need the dot files to get our workspace working correctly. Create the following files (examples can be found in the `examples/dotFiles`[LINK_NEEDED] directory).\n' +
        '\n';
      let result = parseBlogPost(exampleBody, false);
      it('should contain the correct metadata: Title', () => {
        assert.strictEqual(
          result.title,
          'Creating a Serverless API with Mongo, Docker, and Codeship'
        );
      });
      it('should contain the correct metadata: blogPostId', () => {
        assert.strictEqual(
          result.blogPostId,
          'creating-a-serverless-api-with-mongo-docker-and-codeship'
        );
      });
      it('should contain the correct metadata: previewText', () => {
        assert.strictEqual(
          result.previewText,
          "This article is a real doozy. I'm going to walk you through creating a RESTful Serverless AWS Lambda API running Node. We'll create an example API to handle blog posts, specifically the following  - GET all blog posts - GET specific posts by id - POST to create a new blog post - PATCH to edit a…"
        );
      });
      it('should contain the correct body, with NO table of contents', () => {
        assert.strictEqual(result.body, expectedResultBody);
      });
    });
    describe('-> Provided An MD with duplicate headers of the same level', () => {
      let exampleBody =
        '\r\n' +
        'Content-Disposition: form-data; name=""; filename="Steps.md"\r\n' +
        'Content-Type: text/markdown\r\n' +
        '\r\n' +
        '# Creating a Serverless API with Mongo, Docker, and Codeship\n' +
        '\n' +
        "This article is a real doozy. I'm going to walk you through creating a RESTful Serverless AWS Lambda API running Node. We'll create an example API to handle blog posts, specifically the following:\n" +
        '\n' +
        '- `GET` all blog posts\n' +
        '- `GET` specific posts by id\n' +
        '- `POST` to create a new blog post\n' +
        '- `PATCH` to edit a blog post\n' +
        '- `DELETE` to delete a blog post\n' +
        '\n' +
        "Create a repo using your version control software and let's get started.\n" +
        '\n' +
        '## `npm init`\n' +
        '\n' +
        '## `npm init`\n' +
        '\n' +
        'Using `npm init`, answer the questions. After generating the `package.json`, edit it by removing the `"main"` line, since we won\'t have a main entrance to our API.\n' +
        '\n' +
        '## Get Workspace ready\n' +
        '\n' +
        '### Install Dependencies\n' +
        '\n';
      let result = parseBlogPost(exampleBody);
      it('should correctly return an error when encountering duplicate headers', () => {
        assert.strictEqual(result.error, 'Found two matching headers. Lines: 12 and 14');
      });
    });
    describe('-> Provided An MD with duplicate headers of different levels', () => {
      let exampleBody =
        '\r\n' +
        'Content-Disposition: form-data; name=""; filename="Steps.md"\r\n' +
        'Content-Type: text/markdown\r\n' +
        '\r\n' +
        '# Creating a Serverless API with Mongo, Docker, and Codeship\n' +
        '\n' +
        "This article is a real doozy. I'm going to walk you through creating a RESTful Serverless AWS Lambda API running Node. We'll create an example API to handle blog posts, specifically the following:\n" +
        '\n' +
        '- `GET` all blog posts\n' +
        '- `GET` specific posts by id\n' +
        '- `POST` to create a new blog post\n' +
        '- `PATCH` to edit a blog post\n' +
        '- `DELETE` to delete a blog post\n' +
        '\n' +
        "Create a repo using your version control software and let's get started.\n" +
        '\n' +
        '## `npm init`\n' +
        '\n' +
        '### `npm init`\n' +
        '\n' +
        'Using `npm init`, answer the questions. After generating the `package.json`, edit it by removing the `"main"` line, since we won\'t have a main entrance to our API.\n' +
        '\n' +
        '## Get Workspace ready\n' +
        '\n' +
        '### Install Dependencies\n' +
        '\n';
      let result = parseBlogPost(exampleBody);
      it('should correctly return an error when encountering duplicate headers', () => {
        assert.strictEqual(result.error, 'Found two matching headers. Lines: 12 and 14');
      });
    });
    describe('-> Provided An MD without an h1 header', () => {
      let exampleBody =
        '\r\n' +
        'Content-Disposition: form-data; name=""; filename="Steps.md"\r\n' +
        'Content-Type: text/markdown\r\n' +
        '\r\n' +
        '\n' +
        "This article is a real doozy. I'm going to walk you through creating a RESTful Serverless AWS Lambda API running Node. We'll create an example API to handle blog posts, specifically the following:\n" +
        '\n' +
        '- `GET` all blog posts\n' +
        '- `GET` specific posts by id\n' +
        '- `POST` to create a new blog post\n' +
        '- `PATCH` to edit a blog post\n' +
        '- `DELETE` to delete a blog post\n' +
        '\n' +
        "Create a repo using your version control software and let's get started.\n" +
        '\n' +
        '## `npm init`\n' +
        '\n' +
        'Using `npm init`, answer the questions. After generating the `package.json`, edit it by removing the `"main"` line, since we won\'t have a main entrance to our API.\n' +
        '\n' +
        '## Get Workspace ready\n' +
        '\n' +
        '### Install Dependencies\n' +
        '\n';
      let result = parseBlogPost(exampleBody);
      it('should correctly return an error', () => {
        assert.strictEqual(result.error, 'Found no h1 headers');
      });
    });
    describe('-> Provided An MD more than one h1 header', () => {
      let exampleBody =
        '\r\n' +
        'Content-Disposition: form-data; name=""; filename="Steps.md"\r\n' +
        'Content-Type: text/markdown\r\n' +
        '\r\n' +
        '# Creating a Serverless API with Mongo, Docker, and Codeship\n' +
        '\n' +
        "This article is a real doozy. I'm going to walk you through creating a RESTful Serverless AWS Lambda API running Node. We'll create an example API to handle blog posts, specifically the following:\n" +
        '\n' +
        '- `GET` all blog posts\n' +
        '- `GET` specific posts by id\n' +
        '- `POST` to create a new blog post\n' +
        '- `PATCH` to edit a blog post\n' +
        '- `DELETE` to delete a blog post\n' +
        '\n' +
        "Create a repo using your version control software and let's get started.\n" +
        '\n' +
        '## `npm init`\n' +
        '\n' +
        'Using `npm init`, answer the questions. After generating the `package.json`, edit it by removing the `"main"` line, since we won\'t have a main entrance to our API.\n' +
        '\n' +
        '## Get Workspace ready\n' +
        '\n' +
        '# Install Dependencies\n' +
        '\n';
      let result = parseBlogPost(exampleBody);
      it('should correctly return an error', () => {
        assert.strictEqual(result.error, 'More than one h1 header found on lines 0, 18');
      });
    });
    describe('-> Provided A normal MD, but asked not to produce a Table of Contents, the body should be returned unmolested ', () => {
      let exampleBody =
        '\r\n' +
        'Content-Disposition: form-data; name=""; filename="Steps.md"\r\n' +
        'Content-Type: text/markdown\r\n' +
        '\r\n' +
        '# Creating a Serverless API with Mongo, Docker, and Codeship\n' +
        '\n' +
        "This article is a real doozy. I'm going to walk you through creating a RESTful Serverless AWS Lambda API running Node. We'll create an example API to handle blog posts, specifically the following:\n" +
        '\n' +
        '- `GET` all blog posts\n' +
        '- `GET` specific posts by id\n' +
        '- `POST` to create a new blog post\n' +
        '- `PATCH` to edit a blog post\n' +
        '- `DELETE` to delete a blog post\n' +
        '\n' +
        "Create a repo using your version control software and let's get started.\n" +
        '\n' +
        '## `npm init`\n' +
        '\n' +
        'Using `npm init`, answer the questions. After generating the `package.json`, edit it by removing the `"main"` line, since we won\'t have a main entrance to our API.\n' +
        '\n' +
        '## Get Workspace ready\n' +
        '\n' +
        '### Install Dependencies\n' +
        '\n';
      let expectedResultBody =
        "This article is a real doozy. I'm going to walk you through creating a RESTful Serverless AWS Lambda API running Node. We'll create an example API to handle blog posts, specifically the following:\n" +
        '\n' +
        '- `GET` all blog posts\n' +
        '- `GET` specific posts by id\n' +
        '- `POST` to create a new blog post\n' +
        '- `PATCH` to edit a blog post\n' +
        '- `DELETE` to delete a blog post\n' +
        '\n' +
        "Create a repo using your version control software and let's get started.\n" +
        '\n' +
        '## `npm init`\n' +
        '\n' +
        'Using `npm init`, answer the questions. After generating the `package.json`, edit it by removing the `"main"` line, since we won\'t have a main entrance to our API.\n' +
        '\n' +
        '## Get Workspace ready\n' +
        '\n' +
        '### Install Dependencies\n' +
        '\n';
      let result = parseBlogPost(exampleBody, false);
      it('should return the body as expected', () => {
        assert.strictEqual(result.body, expectedResultBody);
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
