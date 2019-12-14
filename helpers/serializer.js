const JSONAPISerializer = require('json-api-serializer');
const Serializer = new JSONAPISerializer();

const baseOptions = {
  id: 'blogPostId',
  blacklist: ['__v', '_id'],
  jsonapiObject: false
};

Serializer.register('blogPost', baseOptions);

module.exports.Serializer = Serializer;
