/**
 * Accepts a string and a number for the max number of characters desired.
 * If the string is longer than the max number of characters, it trims to the last full word within that limit.
 * @param {array} string - the string to be truncated
 * @param {number} maxChars - a number to limit the number of characters in the returned string
 * @returns {string} the truncated version of the string
 */
module.exports.truncate = (string, maxChars) => {
  string = string.replace(/\n/g, '');
  if (!string) {
    return string;
  }
  const pattern = new RegExp(`(^.{0,${maxChars - 2}}\\w)[^\\w]`, 's');
  return string.length <= maxChars ? string : string.match(pattern)[1] + String.fromCharCode(8230);
};
