import {deviceIsAndroid} from './CONST'


/**
 * Send a click event to the specified element.
 *
 * @param {EventTarget|Element} targetElement
 * @param {Event} event
 */
export default function sendClick (targetElement, event) {
  let clickEvent, touch

  // On some Android devices activeElement needs to be blurred otherwise the synthetic click will have no effect (#24)
  if (document.activeElement && document.activeElement !== targetElement) {
    document.activeElement.blur()
  }

  touch = event.changedTouches[0]

  // Synthesise a click event, with an extra attribute so it can be tracked
  clickEvent = document.createEvent('MouseEvents')

  //Issue #159: Android Chrome Select Box does not open with a synthetic click event
  clickEvent.initMouseEvent(deviceIsAndroid && targetElement.tagName === 'SELECT' ? 'mousedown' : 'click', true, true, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null)
  clickEvent.forwardedTouchEvent = true
  targetElement.dispatchEvent(clickEvent)
}