'use strict';

const { truncate } = require('../helpers/truncate');
const { slugify } = require('../helpers/slugify');

module.exports.parseBlogPost = (body, shouldCreateContents = true) => {
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

  // Find all headers
  for (let i = 0; i < parseBody.length; i++) {
    line = parseBody[i];
    // Skip code blocks
    if (line.match(/^```/)) {
      do {
        i++;
        line = parseBody[i];
      } while (!line.match(/^```/));
      continue;
    }
    // Find Headers
    let match = line.match(/^# (.+)/);
    if (match) {
      h1.push({ match, lineNum: i });
    }
    match = line.match(/(^#+) (.+)/);
    if (match) {
      match.lineNum = i;
      headers.push(match);
    }
  }
  if (!h1.length) {
    return { error: 'Found no h1 headers' };
  } else if (h1.length > 1) {
    return {
      error: `More than one h1 header found on lines ${h1.map(header => header.lineNum).join(', ')}`
    };
  } else {
    title = h1[0].match.input.replace('# ', '');
    blogPostId = slugify(title);
    blogPostId = blogPostId.replace(/[^\w\-]/g, '');
    blogPostId = blogPostId.toLowerCase();
    bodyWithoutHeader = body.slice(h1[0].match.input.length + 2);

    // Remove links and such to get the preview text, then truncate.
    previewText = bodyWithoutHeader.replace(/\]\(.*?\)/g, '');
    previewText = previewText.replace(/[^\w\n \-.;!,'"\(\)]/g, '');
    previewText = truncate(previewText, 300);
  }
  if (shouldCreateContents === true) {
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
      contents += `- [${text}](#${slugify(text)})\n`;
    }
    contents += '\n----\n\n';
    body = contents + bodyWithoutHeader;
  } else {
    body = bodyWithoutHeader;
  }

  return { title, blogPostId, previewText, body };
};
