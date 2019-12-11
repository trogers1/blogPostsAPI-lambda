const JSONAPISerializer = require('json-api-serializer');
const Serializer = new JSONAPISerializer();

const baseOptions = {
  blacklist: ['__v'],
  jsonapiObject: false
};

Serializer.register('course', baseOptions);
Serializer.register('groupTypeClass', baseOptions);
Serializer.register('groupType', baseOptions);
Serializer.register('group', baseOptions);

module.exports.Serializer = Serializer;
