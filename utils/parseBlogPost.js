'use strict';

const { truncate } = require('../helpers/truncate');
const { slugify } = require('../helpers/slugify');

module.exports.parseBlogPost = body => {
  let title, blogPostId, previewText;
  body = body.split('\r\n').filter(item => item.length);
  body = body[2];
  let parseBody = body;
  parseBody = parseBody.split('\n');

  let h1 = [],
    contents,
    headers = [],
    line,
    bodyWithoutHeader;
  for (let i = 0; i < parseBody.length; i++) {
    line = parseBody[i];
    let match = line.match(/^# \w+/);
    if (match) {
      h1.push({ match, lineNum: i });
    }
    if (line.match(/^## Contents$/)) {
      contents = i;
    }
    match = line.match(/(^#+) (.+)/);
    if (match) {
      match.lineNum = i;
      headers.push(match);
    }
  }
  if (!h1) {
    return { error: 'Found no h1 headers' };
  } else if (h1.length > 1) {
    return {
      error: `More than one h1 header found on lines ${h1.map(header => header.lineNum).join(', ')}`
    };
  } else {
    title = h1[0].match.input.replace('# ', '');
    blogPostId = slugify(title);
    blogPostId = blogPostId.replace(/[^\w-]/g, '');
    blogPostId = blogPostId.toLowerCase();
    bodyWithoutHeader = body.slice(h1[0].match.input.length);
    previewText = truncate(bodyWithoutHeader, 100);
  }

  if (!contents) {
    contents = '## Contents\n';
    headers.shift(); // remove h1
    while (headers.length) {
      let header = headers.shift();
      let level = header[1].length - 2;
      let text = header[2];
      let matchingHeader = headers.findIndex(item => item[2] === text);
      if (matchingHeader !== -1) {
        return {
          error: `Found two matching headers. Lines: ${header.lineNum} and ${headers[matchingHeader].lineNum}`
        };
      }
      contents += `${'  '.repeat(level)}`;
      contents += `- [${text}](${'#'.repeat(header[1].length)}${slugify(text)})\n`;
      headers.shift();
    }
    contents += '\n----\n';
    body = contents + bodyWithoutHeader;
  }

  return { title, blogPostId, previewText, body };
};