import {deviceIsIOS, deviceIsIOS4} from './CONST'


/**
 * On touch start, record the position and scroll offset.
 *
 * @param {Event} event
 * @returns {boolean}
 */
export default function touchstart(event) {
  var targetElement, touch, selection, touchStartTime
		
  // iOS (at least 11.4 and 11.4 beta) can return smaller event.timeStamp values after resuming with
  // Cordova using UIWebView (and possibly also with mobile Safari?), the timeStamp values can also
  // be negative
  // https://github.com/ftlabs/fastclick/issues/549
  if (event.timeStamp < 0) {
    touchStartTime = (new Date()).getTime();
    this.isTrackingClickStartFromEvent = false;
  } else {
    touchStartTime = event.timeStamp;
    this.isTrackingClickStartFromEvent = true;
  }

  // Ignore multiple touches, otherwise pinch-to-zoom is prevented if both fingers are on the FastClick element (issue #111).
  if (event.targetTouches.length > 1) {
    return true
  }

  // On some older browsers (notably Safari on iOS 4.1 - see issue #56) the event target may be a text node.
  targetElement = event.target.nodeType !== Node.TEXT_NODE ? event.target : event.target.parentNode
  touch = event.targetTouches[0]

  if (deviceIsIOS) {

    // Only trusted events will deselect text on iOS (issue #49)
    selection = window.getSelection()
    if (selection.rangeCount && !selection.isCollapsed) {
      return true
    }

    if (!deviceIsIOS4) {

      // Weird things happen on iOS when an alert or confirm dialog is opened from a click event callback (issue #23):
      // when the user next taps anywhere else on the page, new touchstart and touchend events are dispatched
      // with the same identifier as the touch event that previously triggered the click that triggered the alert.
      // Sadly, there is an issue on iOS 4 that causes some normal touch events to have the same identifier as an
      // immediately preceeding touch event (issue #52), so this fix is unavailable on that platform.
      // Issue 120: touch.identifier is 0 when Chrome dev tools 'Emulate touch events' is set with an iOS device UA string,
      // which causes all touch events to be ignored. As this block only applies to iOS, and iOS identifiers are always long,
      // random integers, it's safe to to continue if the identifier is 0 here.
      if (touch.identifier && touch.identifier === this.lastTouchIdentifier) {
        event.preventDefault()
        return false
      }

      this.lastTouchIdentifier = touch.identifier

      // If the target element is a child of a scrollable layer (using -webkit-overflow-scrolling: touch) and:
      // 1) the user does a fling scroll on the scrollable layer
      // 2) the user stops the fling scroll with another tap
      // then the event.target of the last 'touchend' event will be the element that was under the user's finger
      // when the fling scroll was started, causing FastClick to send a click event to that layer - unless a check
      // is made to ensure that a parent layer was not scrolled before sending a synthetic click (issue #42).
      this.updateScrollParent(targetElement)
    }
  }

  this.trackingClick = true
  this.trackingClickStart = touchStartTime
  this.targetElement = targetElement

  this.touchStartX = touch.pageX
  this.touchStartY = touch.pageY

  // Prevent phantom clicks on fast double-tap (issue #36)
  if ((touchStartTime - this.lastClickTime) < this.tapDelay) {
    event.preventDefault()
  }

  return true
}