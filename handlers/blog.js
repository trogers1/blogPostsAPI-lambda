'use strict';
const {
  connectToDatabase,
  formatBadRequestError,
  formatDatabaseError,
  formatInternalError,
  formatNotFoundError
} = require('../utils');
const { Serializer } = require('../helpers/serializer');
const { BlogPost } = require('../models/BlogPost');

module.exports.get = async event => {
  try {
    console.log(event);
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
