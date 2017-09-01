/**
 * like es2015 Object.assign
 *
 * @param {Object} target
 * @param {Object} source
 * @returns {Object} target
 */
export default function assign (target, source) {
  if (source) {
    for (let prop in source) {
      if (source.hasOwnProperty(prop)) {
        target[prop] = source[prop]
      }
    }
  }
  return target
}