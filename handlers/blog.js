'use strict';
const {
  connectToDatabase,
  formatBadRequestError,
  formatDatabaseError,
  formatInternalError,
  formatNotFoundError,
  parseBlogPost
} = require('../utils');
const { Serializer } = require('../helpers/serializer');
const { BlogPost } = require('../models/BlogPost');

module.exports.get = async event => {
  try {
    let id;
    if (event.pathParameters) {
      ({ id } = event.pathParameters);
    }

    let fullText, badQueryParams;
    if (event.queryStringParameters) {
      if (id) {
        ({ fullText, ...badQueryParams } = event.queryStringParameters);
      } else {
        ({ ...badQueryParams } = event.queryStringParameters);
      }
      if (Object.keys(badQueryParams).length) {
        return formatBadRequestError({
          message: `Unrecognized query string parameter(s): ${Object.keys(badQueryParams).join(
            ', '
          )}`
        });
      }
      if (fullText !== 'true') {
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
        'Content-Type': 'application/vnd.api+json; charset=utf-8'
      },
      body: JSON.stringify(serializedResponse)
    };
  } catch (error) {
    return formatInternalError(error);
  }
};

module.exports.post = async event => {
  let tags, type, badQueryParams;
  try {
    if (event.queryStringParameters) {
      ({ tags, type, ...badQueryParams } = event.queryStringParameters);
      if (Object.keys(badQueryParams).length) {
        return formatBadRequestError({
          message: `Unrecognized query string parameter(s): ${Object.keys(badQueryParams).join(
            ', '
          )}`
        });
      }
    }
    tags = tags.split(',').filter(item => item.length);
    if (!tags || !tags.length || !type) {
      return formatBadRequestError({
        message: "Query Params 'tags' and 'type' must be provided to create a new post"
      });
    }
    let boundaryString, eventBody;

    try {
      let contentType = event.headers['Content-Type']
        ? event.headers['Content-Type']
        : event.headers['content-type'];
      if (
        !contentType ||
        !contentType.startsWith('multipart/form-data') ||
        !contentType.includes('boundary=')
      ) {
        return formatBadRequestError({
          message: "Missing required header: 'Content-Type: multipart/form-data'"
        });
      }
      boundaryString = contentType.split('boundary=')[1];

      // .slice() is necessary for how multipart form bodies are formatted
      eventBody = event.body.split(boundaryString).slice(1, -1);
      if (eventBody.length !== 1) {
        return formatInternalError({
          message:
            'Error processing blog post file. Possibly too many or too few files were detected'
        });
      }

      const { title, blogPostId, previewText, body, error } = parseBlogPost(eventBody[0]);

      if (!title || !blogPostId || !previewText) {
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
        location: `/blog/${blogPostId}`
      };
    } catch (error) {
      return formatBadRequestError(error);
    }
  } catch (error) {
    return formatInternalError(error);
  }
};
