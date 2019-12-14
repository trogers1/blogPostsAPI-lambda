const mongoose = require('mongoose');

const { ENV } = process.env;

let collection;
switch (ENV) {
  case 'ci':
    collection = 'LOCAL';
    break;
  case 'QA':
    collection = ENV;
    break;
  case 'PROD':
    collection = ENV;
    break;
  default:
    collection = 'LOCAL';
}

const blogPostSchema = new mongoose.Schema(
  {
    blogPostId: { type: String, index: true },
    body: { type: String, select: false },
    previewText: { type: String },
    tags: { type: [String], index: true },
    title: { type: String, index: true },
    type: { type: String, index: true }
  },
  {
    collection: `blogPosts-`,
    timestamps: true
  }
);

/**
 * Create a global model based on the schema, and export it to be used in other files.
 * Using serverless-offline creates issues as one call will compile the schema, and then
 * a consecutive call will attempt to recompile the model throwing an error. Using a
 * global model avoids this error.
 */
let BlogPost = mongoose.models.BlogPost || mongoose.model('BlogPost', blogPostSchema);
module.exports.BlogPost = BlogPost;
