import {deviceIsAndroid} from './const'


/**
 * Send a click event to the specified element.
 *
 * @param {EventTarget|Element} targetElement
 * @param {Event} event
 */
export default function determineEventType (targetElement) {
  //Issue #159: Android Chrome Select Box does not open with a synthetic click event
  return deviceIsAndroid && targetElement.tagName === 'SELECT' ? 'mousedown' : 'click'
}