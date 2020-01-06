'use strict';
const Ajv = require('ajv');
const ajv = new Ajv({ allErrors: true });
const {
  connectToDatabase,
  formatBadRequestError,
  formatDatabaseError,
  formatInternalError,
  formatNotFoundError,
  formatValidationError,
  parseBlogPost,
  parseBody
} = require('../utils');
const { Serializer } = require('../helpers/serializer');
const { BlogPost } = require('../models/BlogPost');

const blogPostPatchSchema = require('../requestSchemas/blogPostPatchSchema');

module.exports.get = async event => {
  try {
    let id;
    if (event.pathParameters) {
      ({ id } = event.pathParameters);
    }

    let fullText, type, badQueryParams;
    if (event.queryStringParameters) {
      if (id) {
        ({ fullText, ...badQueryParams } = event.queryStringParameters);
      } else {
        ({ type, ...badQueryParams } = event.queryStringParameters);
      }
      if (Object.keys(badQueryParams).length) {
        return formatBadRequestError({
          message: `Unrecognized query string parameter(s): ${Object.keys(badQueryParams).join(
            ', '
          )}`
        });
      }
      if (fullText && fullText !== 'true') {
        return formatBadRequestError({
          message: `The fullText parameter may only be 'true'. Instead, received: ${fullText}`
        });
      }
    }
    let query;
    if (id) {
      query = BlogPost.find({ blogPostId: id });
    } else {
      query = BlogPost.find();
    }
    if (type) {
      query.where({ type });
    }
    if (fullText) {
      query.select('+body');
    }
    let queryResult;
    try {
      await connectToDatabase();
      queryResult = await query;
    } catch (error) {
      throw formatDatabaseError(error);
    }

    if (id) {
      if (!queryResult.length) {
        throw formatNotFoundError({ message: id });
      }
      queryResult = queryResult[0].toObject();
    } else {
      queryResult = queryResult.map(item => item.toObject());
    }

    let serializedResponse = Serializer.serialize('blogPost', queryResult);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/vnd.api+json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(serializedResponse)
    };
  } catch (error) {
    return formatInternalError(error);
  }
};

module.exports.post = async event => {
  let tags,
    type,
    createContents = true,
    badQueryParams;
  try {
    let contentType;
    contentType = event.headers['Content-Type'] || event.headers['content-type'];
    if (
      !contentType ||
      !contentType.startsWith('multipart/form-data') ||
      !contentType.includes('boundary=')
    ) {
      return formatBadRequestError({
        message: "Content-Type header must be present, and must be equal to 'multipart/form-data'"
      });
    }
    if (event.queryStringParameters) {
      ({ tags, type, createContents, ...badQueryParams } = event.queryStringParameters);
      if (Object.keys(badQueryParams).length) {
        return formatBadRequestError({
          message: `Unrecognized query string parameter(s): ${Object.keys(badQueryParams).join(
            ', '
          )}`
        });
      }
      if (createContents && createContents !== 'false') {
        return formatBadRequestError({
          message: "'createContents', if present, can only be equal to 'false'"
        });
      }
    }
    if (tags) {
      tags = tags.split(',').filter(item => item.length);
    }
    if (!tags || !tags.length || !type) {
      return formatBadRequestError({
        message: "Query Params 'tags' and 'type' must be provided to create a new post"
      });
    }
    let boundaryString, eventBody;

    try {
      boundaryString = contentType.split('boundary=')[1];

      // .slice() is necessary for how multipart form bodies are formatted
      eventBody = event.body.split(boundaryString).slice(1, -1);
      if (eventBody.length !== 1) {
        return formatInternalError({
          message:
            'Error processing blog post file. Possibly too many or too few files were detected'
        });
      }

      const { title, blogPostId, previewText, body, error } = parseBlogPost(
        eventBody[0],
        createContents
      );

      if (!title || !blogPostId || !previewText || !body) {
        return formatInternalError({
          message:
            error ||
            `Error parsing Blog Post. Title: ${title}; blogPostId: ${blogPostId}; previewText: ${previewText}`
        });
      }

      try {
        await connectToDatabase();
        // Check that the blogPostId isn't already taken
        let conflictingPosts = await BlogPost.find({ blogPostId });
        if (conflictingPosts.length) {
          return formatBadRequestError({
            message: `Found a pre-existing Blog Post of blogPostId '${blogPostId}'`
          });
        }
        let newDoc = BlogPost({ title, blogPostId, previewText, body, tags, type }),
          doc;
        doc = await newDoc.save();
      } catch (error) {
        throw formatDatabaseError(error);
      }
      return {
        statusCode: 201,
        headers: {
          location: `/blog/${blogPostId}`,
          'Access-Control-Allow-Origin': '*'
        }
      };
    } catch (error) {
      return formatBadRequestError(error);
    }
  } catch (error) {
    return formatInternalError(error);
  }
};

module.exports.patch = async event => {
  /**
   * Testing todo:
   * - change id
   * - bad format
   *  - extra attributes
   *  - missing required
   * - Nothing to change (empty attributes)
   * - make sure that markdown changes id appropriately
   * - test content types (bad content type, markdown, json, etc)
   * - test 'valid' query string param handling
   *  - json
   *  - md
   * - test bad query string param handling
   * - test createContents works as expected
   * - test bad createContents value
   * - test tags with weird formatting
   * - test not-existing id
   * - test no body (both content types)
   * - test invalid json body
   * - test invalid md (check parseBlogPost unit tests?)
   *  - multiple h1
   *  - no h1
   *  - duplicate headers
   * - test uploading multiple files fails appropriately
   * - test the links are updated correctly
   *  - single link
   *  - multiple link
   *  - not all updated
   *  - no links
   *  - Check that all updated ones are in the header
   */
  let tags,
    type,
    createContents = true,
    badQueryParams;
  try {
    let { id } = event.pathParameters;
    let contentType;
    contentType = event.headers['Content-Type'] || event.headers['content-type'];
    if (
      !contentType ||
      (contentType !== 'application/json' && !contentType.startsWith('multipart/form-data'))
    ) {
      return formatBadRequestError({
        message:
          "Content-Type header must be present, and must be equal to 'application/json' or 'multipart/form-data'"
      });
    }
    console.log('content type', contentType);
    console.log(event);
    if (event.queryStringParameters) {
      ({ tags, type, createContents, ...badQueryParams } = event.queryStringParameters);
      if (Object.keys(badQueryParams).length) {
        return formatBadRequestError({
          message: `Unrecognized query string parameter(s): ${Object.keys(badQueryParams).join(
            ', '
          )}`
        });
      }
      if ((tags || type || createContents) && contentType === 'application/json') {
        return formatBadRequestError({
          message: "Query string params are only valid for the 'multipart/form-data' Content-Type"
        });
      }
      if (createContents && createContents !== 'false') {
        return formatBadRequestError({
          message: "'createContents', if present, can only be equal to 'false'"
        });
      }
    }
    if (tags) {
      tags = tags.split(',').filter(item => item.length);
    }

    await connectToDatabase();

    try {
      // Confirm the blog post to be patched exists
      const blogPostToPatch = await BlogPost.find({ blogPostId: id });
      if (!blogPostToPatch.length) {
        const message =
          'The blog post you are trying to patch was not found. Please verify the blogPostId';
        throw formatNotFoundError({ message });
      }
    } catch (error) {
      throw formatDatabaseError(error);
    }

    if (!event.body) {
      const message = 'PATCH requests require a JSON or Multipart/Form-Data body';
      throw formatBadRequestError({ message });
    }

    let title, blogPostId, previewText, body, error;
    // Determine type of patch
    if (contentType === 'application/json') {
      let parsedBody = parseBody(event.body);
      let valid = ajv.validate(blogPostPatchSchema, parsedBody);
      console.log('valid', valid);
      if (!valid) {
        console.log('errors', ajv.errors);
        return formatValidationError(ajv.errors);
      }
      const deserializedBlogPost = await Serializer.deserialize('blogPost', parsedBody);
      console.log('deserialized', deserializedBlogPost);
      ({ title, blogPostId, previewText, tags, type } = deserializedBlogPost);
    } else {
      let boundaryString, eventBody;
      boundaryString = contentType.split('boundary=')[1];

      // .slice() is necessary for how multipart form bodies are formatted
      eventBody = event.body.split(boundaryString).slice(1, -1);
      if (eventBody.length !== 1) {
        return formatInternalError({
          message:
            'Error processing blog post file. Possibly too many or too few files were detected'
        });
      }

      ({ title, blogPostId, previewText, body, error } = parseBlogPost(
        eventBody[0],
        createContents
      ));

      if (error) {
        return formatInternalError({
          message: `Error parsing Blog Post. Title: ${title}; blogPostId: ${blogPostId}; previewText: ${previewText}`
        });
      }
    }

    // Find which attributes will actually be changed:
    let updatedFields = {};
    if (blogPostId) {
      updatedFields.blogPostId = blogPostId;
    }
    if (body) {
      updatedFields.body = body;
    }
    if (previewText) {
      updatedFields.previewText = previewText;
    }
    if (tags) {
      updatedFields.tags = tags;
    }
    if (title) {
      updatedFields.title = title;
    }
    if (type) {
      updatedFields.type = type;
    }
    console.log('blogPostId', blogPostId);
    console.log('id', id);

    // If blogPostId is being updated, find BlogPosts that contain a link to blogPostId, and update the link
    let connectedBlogPosts;
    if (updatedFields.blogPostId) {
      connectedBlogPosts = await BlogPost.find({
        body: { $regex: new RegExp(`${id}(\\/)?\\)`) }
      }).select('+body');
      for (let post of connectedBlogPosts) {
        let updatedConnectedPostBody = post.body.replace(
          new RegExp(`${id}(\\/)?\\)`, 'g'),
          `${blogPostId}/)`
        );
        await BlogPost.findOneAndUpdate(
          { blogPostId: post.blogPostId },
          { body: updatedConnectedPostBody }
        );
      }
      let connectedBlogPosts2 = await BlogPost.find({
        body: { $regex: new RegExp(`${id}(\\/)?\\)`) }
      }).select('+body');
      if (connectedBlogPosts2.length) {
        const message = `Could not update all Connected Blog Posts. Updated: ${connectedBlogPosts
          .filter(post => !connectedBlogPosts2.some(item => item.blogPostId === post.blogPostId))
          .map(post => post.blogPostId)
          .join(', ')}. Not updated: ${connectedBlogPosts2
          .map(post => post.blogPostId)
          .join(', ')}. `;
        return formatInternalError({ message });
      }
    }
    // Validation complete. Update the record in the DB. The { new: true } tells mongoose to return
    // the record after the update has occurred. By default, findOneAndUpdate() returns the record
    // as it was before the update as it originally found it.
    const updateResult = await BlogPost.findOneAndUpdate({ blogPostId: id }, updatedFields, {
      new: true
    }).select('+body');
    let serializedResponse = Serializer.serialize('blogPost', updateResult.toObject());
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/vnd.api+json; charset=utf-8',
        'Updated-Posts': `${connectedBlogPosts.map(post => post.blogPostId).join(',')}`,
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(serializedResponse)
    };
  } catch (error) {
    return formatInternalError(error);
  }
};

/**
 * The DELETE method for the blogPost collection. This method expects a blogPostId as a path
 * parameter of the event. If the ID is valid, it will delete the corresponding BlogPost record
 * in the database. However, it will find any other BlogPosts whose bodies contain a link to the
 * given blogPostId. If any are found, it will abort the deletion and return the blogPostIds of the
 * records that mention the BlogPost to be deleted.
 */
module.exports.delete = async event => {
  try {
    const { id: blogPostId } = event.pathParameters;
    if (event.queryStringParameters) {
      // Do not allow any queryString parameters
      if (event.queryStringParameters) {
        const message = `Query string parameters are not accepted at this resource. Query string parameters found: ${Object.keys(
          event.queryStringParameters
        ).join(', ')}`;
        throw formatBadRequestError({ message });
      }
    }

    await connectToDatabase();

    try {
      // Find BlogPosts that contain a link to blogPostId, and return an error if any are found...
      let connectedBlogPosts = await BlogPost.find({
        body: { $regex: new RegExp(`${blogPostId}(\\/)?\\)`) }
      });
      if (connectedBlogPosts.length) {
        return formatBadRequestError({
          message: `Cannot delete. Found the following connected Blog Posts: ${connectedBlogPosts
            .map(item => `'${item.blogPostId}'`)
            .join(', ')}`
        });
      }

      const deletedCourse = await BlogPost.findOneAndDelete({ blogPostId });
      if (!deletedCourse) {
        const message = 'The BlogPost you are trying to delete was not found. Please verify the id';
        throw formatNotFoundError({ message });
      }
    } catch (error) {
      throw formatDatabaseError(error);
    }

    return {
      statusCode: 204,
      headers: {
        'Content-Type': 'application/vnd.api+json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    };
  } catch (error) {
    return formatInternalError(error);
  }
};
