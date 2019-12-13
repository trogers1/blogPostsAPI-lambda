const mongoose = require('mongoose');
const { formatDatabaseError } = require('./formatDatabaseError');

let { ENV, DB_URL } = process.env;
console.log('=> ENV: ', ENV);
let url;
switch (ENV) {
  case 'ci':
    url = 'mongodb://mongodb:27017/taylor-rogers';
    break;
  case 'QA':
  case 'PROD':
    url = DB_URL;
    break;
  default:
    url = 'mongodb://localhost:27017/taylor-rogers';
}

function connectToDatabase() {
  if (mongoose.connection.readyState) {
    console.log('=> using existing database connection...');
    return;
  }
  console.log('=> creating new database connection...');
  console.log(`=> Connection URL: ${url}`);

  return mongoose.connect(url).catch(error => {
    throw formatDatabaseError({ message: error.name });
  });
}

module.exports = {
  connectToDatabase
};
