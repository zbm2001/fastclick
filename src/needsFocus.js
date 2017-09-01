import {deviceIsAndroid} from './CONST'


/**
 * Determine whether a given element requires a call to focus to simulate click into element.
 *
 * @param {EventTarget|Element} target Target DOM element
 * @returns {boolean} Returns true if the element requires a call to focus to simulate native click.
 */
export default function needsFocus (target) {
  switch (target.nodeName) {
    case 'TEXTAREA':
      return true

    case 'SELECT':
      return !deviceIsAndroid

    case 'INPUT':
      switch (target.type) {
        case 'button':
        case 'checkbox':
        case 'file':
        case 'image':
        case 'radio':
        case 'submit':
          return false
      }

      // No point in attempting to focus disabled inputs
      return !target.disabled && !target.readOnly

    default:
      return (/\bneedsfocus\b/).test(target.className)
  }
}