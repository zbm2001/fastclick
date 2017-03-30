import {deviceIsIOS} from './const'


/**
 * Determine whether a given element requires a native click.
 *
 * @param {EventTarget|Element} target Target DOM element
 * @returns {boolean} Returns true if the element needs a native click
 */
export default function needsClick (target) {
  switch (target.nodeName) {
    // Don't send a synthetic click to disabled inputs (issue #62)
    case 'BUTTON':
    case 'SELECT':
    case 'TEXTAREA':
      if (target.disabled) return true
      break

    case 'INPUT':
      // File inputs need real clicks on iOS 6 due to a browser bug (issue #68)
      if ((deviceIsIOS && target.type === 'file') || target.disabled) return true
      break

    case 'LABEL':
    case 'IFRAME': // iOS8 homescreen apps can prevent events bubbling into frames
    case 'VIDIO':
      return true
  }

  return /\bneedsclick\b/.test(target.className)
}