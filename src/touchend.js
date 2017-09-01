import {deviceIsIOS, deviceIsIOS4} from './CONST'
import findControl from './findControl'


/**
 * On touch end, determine whether to send a click event at once.
 *
 * @param {Event} event
 * @returns {boolean}
 */
export default function touchend (event) {
  var forElement, trackingClickStart, targetTagName, scrollParent, touch, targetElement = this.targetElement

  if (!this.trackingClick) return

  // Prevent phantom clicks on fast double-tap (issue #36)
  if ((event.timeStamp - this.lastClickTime) < this.tapDelay) {
    this.cancelNextClick = true
    return
  }

  if ((event.timeStamp - this.trackingClickStart) > this.tapTimeout) return

  // Reset to prevent wrong click cancel on input (issue #156).
  this.cancelNextClick = false

  this.lastClickTime = event.timeStamp

  trackingClickStart = this.trackingClickStart
  this.trackingClick = false
  this.trackingClickStart = 0

  // On some iOS devices, the targetElement supplied with the event is invalid if the layer
  // is performing a transition or scroll, and has to be re-detected manually. Note that
  // for this to function correctly, it must be called *after* the event target is checked!
  // See issue #57 also filed as rdar://13048589 .
  if (deviceIsIOSWithBadTarget) {
    touch = event.changedTouches[0]

    // In certain cases arguments of elementFromPoint can be negative, so prevent setting targetElement to null
    targetElement = document.elementFromPoint(touch.pageX - window.pageXOffset, touch.pageY - window.pageYOffset) || targetElement
    targetElement.fastClickScrollParent = this.targetElement.fastClickScrollParent
  }

  targetTagName = targetElement.tagName
  if (targetTagName === 'LABEL') {
    forElement = findControl(targetElement)
    if (forElement) {
      this.focus(targetElement)
      if (deviceIsAndroid) return

      targetElement = forElement
    }
  } else if (this.needsFocus(targetElement)) {

    // Case 1: If the touch started a while ago (best guess is 100ms based on tests for issue #36) then focus will be triggered anyway. Return early and unset the target element reference so that the subsequent click will be allowed through.
    // Case 2: Without this exception for input elements tapped when the document is contained in an iframe, then any inputted text won't be visible even though the value attribute is updated as the user types (issue #37).
    if ((event.timeStamp - trackingClickStart) > 100 || (deviceIsIOS && window.top !== window && targetTagName === 'INPUT')) {
      this.targetElement = null
      return
    }

    this.focus(targetElement)
    this.sendClick(targetElement, event)

    // Select elements need the event to go through on iOS 4, otherwise the selector menu won't open.
    // Also this breaks opening selects when VoiceOver is active on iOS6, iOS7 (and possibly others)
    if (!deviceIsIOS || targetTagName !== 'SELECT') {
      this.targetElement = null
      event.preventDefault()
    }

    return
  }

  if (deviceIsIOS && !deviceIsIOS4) {

    // Don't send a synthetic click event if the target element is contained within a parent layer that was scrolled
    // and this tap is being used to stop the scrolling (usually initiated by a fling - issue #42).
    scrollParent = targetElement.fastClickScrollParent
    if (scrollParent && scrollParent.fastClickLastScrollTop !== scrollParent.scrollTop) return
  }

  // Prevent the actual click from going though - unless the target node is marked as requiring
  // real clicks or if it is in the whitelist in which case only non-programmatic clicks are permitted.
  if (!this.needsClick(targetElement)) {
    event.preventDefault()
    this.sendClick(targetElement, event)
  }
}