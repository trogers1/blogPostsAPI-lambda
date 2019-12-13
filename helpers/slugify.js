/**
 * Accepts a string to be slugified, replaces spaces with dashes, and removes non-word characters
 * that aren't dashes.
 * @param {array} string - the string to be slugified
 * @returns {string} the slugified version of the string
 */
module.exports.slugify = string => {
  string = string.trim();
  if (!string) {
    return string;
  }
  let newString = string.replace(/[^\w\s-]/g, '');
  newString = newString.trim();
  newString = newString.replace(/\s/g, '-');
  newString = newString.toLowerCase();
  return newString;
};
