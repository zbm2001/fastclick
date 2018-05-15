'use strict';

var zUtils = require('z-utils');

var userAgent = window.navigator.userAgent;


/**
 * Windows Phone 8.1 fakes user agent string to look like Android and iPhone.
 *
 * @type boolean
 */
var deviceIsWindowsPhone = userAgent.indexOf("Windows Phone") > -1;


/**
 * Android requires exceptions.
 *
 * @type boolean
 */
var deviceIsAndroid$1 = userAgent.indexOf('Android') > 0 && !deviceIsWindowsPhone;


/**
 * iOS requires exceptions.
 *
 * @type boolean
 */
var deviceIsIOS = /iP(ad|hone|od)/.test(userAgent) && !deviceIsWindowsPhone;


/**
 * iOS 4 requires an exception for select elements.
 *
 * @type boolean
 */
var deviceIsIOS4 = deviceIsIOS && /OS 4_\d(_\d)?/.test(userAgent);


/**
 * iOS 6.0-7.* requires the target element to be manually derived
 *
 * @type boolean
 */
var deviceIsIOSWithBadTarget$1 = deviceIsIOS && /OS [6-7]_\d/.test(userAgent);


/**
 * BlackBerry requires exceptions.
 *
 * @type boolean
 */
var deviceIsBlackBerry10 = userAgent.indexOf('BB10') > 0;


/**
 * BlackBerry requires exceptions.
 *
 * @type boolean
 */
var presetEventArgs = [
  ['click', !0],
  ['touchstart', !1],
  ['touchmove', !1],
  ['touchend', !1],
  ['touchcancel', !1]
  // Set up event handlers as required
].concat(deviceIsAndroid$1 ? [
  ['mouseover', !0],
  ['mousedown', !0],
  ['mouseup', !0]
] : []);

/**
 * Check whether FastClick is needed.
 *
 * @param {Element} layer The layer to listen on
 */
function notNeeded (layer) {
  var metaViewport,
      chromeVersion,
      blackberryVersion,
      firefoxVersion;

  // Devices that don't support touch don't need FastClick
  if (typeof window.ontouchstart === 'undefined') { return true }

  // Chrome version - zero for other browsers
  chromeVersion = /Chrome\/([0-9]+)/.test(userAgent) && RegExp.$1;

  if (chromeVersion) {

    // Chrome desktop doesn't need FastClick (issue #15)
    if (!deviceIsAndroid$1) { return true }

    metaViewport = document.querySelector('meta[name=viewport]');

    if (metaViewport) {
      // Chrome on Android with user-scalable="no" doesn't need FastClick (issue #89)
      if (metaViewport.content.indexOf('user-scalable=no') > -1) { return true }

      // Chrome 32 and above with width=device-width or less don't need FastClick
      if (chromeVersion > 31 && document.documentElement.scrollWidth <= window.outerWidth) { return true }
    }
  }

  if (deviceIsBlackBerry10) {
    blackberryVersion = userAgent.match(/Version\/([0-9]*)\.([0-9]*)/);

    // BlackBerry 10.3+ does not require Fastclick library.
    // https://github.com/ftlabs/fastclick/issues/251
    if (blackberryVersion[1] >= 10 && blackberryVersion[2] >= 3) {
      metaViewport = document.querySelector('meta[name=viewport]');

      if (metaViewport) {
        // user-scalable=no eliminates click delay.
        if (metaViewport.content.indexOf('user-scalable=no') > -1) { return true }

        // width=device-width (or less than device-width) eliminates click delay.
        if (document.documentElement.scrollWidth <= window.outerWidth) { return true }
      }
    }
  }

  // IE10 with -ms-touch-action: none or manipulation, which disables double-tap-to-zoom (issue #97)
  if (layer.style.msTouchAction === 'none' || layer.style.touchAction === 'manipulation') { return true }

  // Firefox version - zero for other browsers
  firefoxVersion = /Firefox\/([0-9]+)/.exec(userAgent) && RegExp.$1;

  if (firefoxVersion >= 27) {
    // Firefox 27+ does not have tap delay if the content is not zoomable - https://bugzilla.mozilla.org/show_bug.cgi?id=922896

    metaViewport = document.querySelector('meta[name=viewport]');
    if (metaViewport && (metaViewport.content.indexOf('user-scalable=no') > -1 || document.documentElement.scrollWidth <= window.outerWidth)) { return true }
  }

  // IE11: prefixed -ms-touch-action is no longer supported and it's recomended to use non-prefixed version
  // http://msdn.microsoft.com/en-us/library/windows/apps/Hh767313.aspx
  if (layer.style.touchAction === 'none' || layer.style.touchAction === 'manipulation') { return true }

  return false
}

/**
 * On actual clicks, determine whether this is a touch-generated click, a click action occurring
 * naturally after a delay after a touch (which needs to be cancelled to avoid duplication), or
 * an actual click which should be permitted.
 *
 * @param {Event} event
 * @returns {boolean}
 */
function click (event) {
  if (this.trackingClick) {
    this.targetElement = null;
    this.trackingClick = false;
    return
  }

  // Very odd behaviour on iOS (issue #18): if a submit element is present inside a form and the user hits enter in the iOS simulator or clicks the Go button on the pop-up OS keyboard the a kind of 'fake' click event will be triggered with the submit-type input element as the target.
  if (event.detail === 0 && event.target.type === 'submit') { return }

  // Only unset targetElement if the click is not permitted. This will ensure that the check for !targetElement in onMouse fails and the browser's click doesn't go through.
  this.onMouse(event) || (this.targetElement = null);
}

/**
 * Determine mouse events which should be permitted.
 *
 * @param {Event} event
 * @returns {boolean}
 */
function onMouse (event) {

  // If a target element was never set (because a touch event was never fired) allow the event
  if (!this.targetElement) { return true }

  if (event.forwardedTouchEvent) { return true }

  // Programmatically generated events targeting a specific element should be permitted
  if (!event.cancelable) { return true }

  // Derive and check the target element to see whether the mouse event needs to be permitted;
  // unless explicitly enabled, prevent non-touch click events from triggering actions,
  // to prevent ghost/doubleclicks.
  if (!this.needsClick(this.targetElement) || this.cancelNextClick) {

    // Prevent any user-added listeners declared on FastClick element from being fired.
    if (event.stopImmediatePropagation) {
      event.stopImmediatePropagation();
    } else {

      // Part of the hack for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
      event.propagationStopped = true;
    }

    // Cancel the event
    event.stopPropagation();
    event.preventDefault();

    return false;
  }

  // If the mouse event is permitted, return true for the action to go through.
  return true;
}

/**
 * On touch start, record the position and scroll offset.
 *
 * @param {Event} event
 * @returns {boolean}
 */
function touchstart(event) {
  var targetElement, touch, selection, touchStartTime;
		
  // iOS (at least 11.4 and 11.4 beta) can return smaller event.timeStamp values after resuming with
  // Cordova using UIWebView (and possibly also with mobile Safari?), the timeStamp values can also
  // be negative
  // https://github.com/ftlabs/fastclick/issues/549
  // if (event.timeStamp < 0) {
    touchStartTime = (new Date()).getTime();
    this.isTrackingClickStartFromEvent = false;
  // } else {
  //   touchStartTime = event.timeStamp;
  //   this.isTrackingClickStartFromEvent = true;
  // }

  // Ignore multiple touches, otherwise pinch-to-zoom is prevented if both fingers are on the FastClick element (issue #111).
  if (event.targetTouches.length > 1) {
    return true
  }

  // On some older browsers (notably Safari on iOS 4.1 - see issue #56) the event target may be a text node.
  targetElement = event.target.nodeType !== Node.TEXT_NODE ? event.target : event.target.parentNode;
  touch = event.targetTouches[0];

  if (deviceIsIOS) {

    // Only trusted events will deselect text on iOS (issue #49)
    selection = window.getSelection();
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
        event.preventDefault();
        return false
      }

      this.lastTouchIdentifier = touch.identifier;

      // If the target element is a child of a scrollable layer (using -webkit-overflow-scrolling: touch) and:
      // 1) the user does a fling scroll on the scrollable layer
      // 2) the user stops the fling scroll with another tap
      // then the event.target of the last 'touchend' event will be the element that was under the user's finger
      // when the fling scroll was started, causing FastClick to send a click event to that layer - unless a check
      // is made to ensure that a parent layer was not scrolled before sending a synthetic click (issue #42).
      this.updateScrollParent(targetElement);
    }
  }

  this.trackingClick = true;
  this.trackingClickStart = touchStartTime;
  this.targetElement = targetElement;

  this.touchStartX = touch.pageX;
  this.touchStartY = touch.pageY;

  // Prevent phantom clicks on fast double-tap (issue #36)
  if ((touchStartTime - this.lastClickTime) < this.tapDelay) {
    event.preventDefault();
  }

  return true
}

/**
 * Update the last position.
 *
 * @param {Event} event
 * @returns {boolean}
 */
function touchmove (event) {
  // If the touch has moved, cancel the click tracking
  if (this.trackingClick && (this.targetElement === (event.target.nodeType !== Node.TEXT_NODE ? event.target : event.target.parentNode) || this.touchHasMoved(event))) {
    this.trackingClick = false;
    this.targetElement = null;
  }
}

/**
 * Attempt to find the labelled control for the given label element.
 *
 * @param {EventTarget|HTMLLabelElement} labelElement
 * @returns {Element|null}
 */
var findControl = ('control' in document.createElement('label')
    ? function findControl (labelElement) {
      return labelElement.control
    }
    : function findControl (labelElement) {

      // Fast path for newer browsers supporting the HTML5 control attribute
      if (labelElement.control !== undefined) {
        return labelElement.control
      }

      // All browsers under test that support touch events also support the HTML5 htmlFor attribute
      if (labelElement.htmlFor) {
        return document.getElementById(labelElement.htmlFor)
      }

      // If no for attribute exists, attempt to retrieve the first labellable descendant element
      // the list of which is defined here: http://www.w3.org/TR/html5/forms.html#category-label
      return labelElement.querySelector('button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea')
    });

/**
 * On touch end, determine whether to send a click event at once.
 *
 * @param {Event} event
 * @returns {boolean}
 */
function touchend (event) {
  var forElement, trackingClickStart, targetTagName, scrollParent, touch, touchEndTime, targetElement = this.targetElement;

  if (this.isTrackingClickStartFromEvent) {
    touchEndTime = event.timeStamp;
  } else {
    // iOS (at least 11.4 and 11.4 beta) can return smaller event.timeStamp values after resuming with
    // Cordova using UIWebView (and possibly also with mobile Safari?), the timeStamp values can also
    // be negative
    // https://github.com/ftlabs/fastclick/issues/549
    touchEndTime = (new Date()).getTime();
  }

  if (!this.trackingClick) { return }

  // Prevent phantom clicks on fast double-tap (issue #36)
  if ((touchEndTime - this.lastClickTime) < this.tapDelay) {
    this.cancelNextClick = true;
    return
  }

  if ((touchEndTime - this.trackingClickStart) > this.tapTimeout) { return }

  // Reset to prevent wrong click cancel on input (issue #156).
  this.cancelNextClick = false;

  this.lastClickTime = touchEndTime;

  trackingClickStart = this.trackingClickStart;
  this.trackingClick = false;
  this.trackingClickStart = 0;

  // On some iOS devices, the targetElement supplied with the event is invalid if the layer
  // is performing a transition or scroll, and has to be re-detected manually. Note that
  // for this to function correctly, it must be called *after* the event target is checked!
  // See issue #57 also filed as rdar://13048589 .
  if (deviceIsIOSWithBadTarget) {
    touch = event.changedTouches[0];

    // In certain cases arguments of elementFromPoint can be negative, so prevent setting targetElement to null
    targetElement = document.elementFromPoint(touch.pageX - window.pageXOffset, touch.pageY - window.pageYOffset) || targetElement;
    targetElement.fastClickScrollParent = this.targetElement.fastClickScrollParent;
  }

  targetTagName = targetElement.tagName;
  if (targetTagName === 'LABEL') {
    forElement = findControl(targetElement);
    if (forElement) {
      this.focus(targetElement);
      if (deviceIsAndroid) { return }

      targetElement = forElement;
    }
  } else if (this.needsFocus(targetElement)) {

    // Case 1: If the touch started a while ago (best guess is 100ms based on tests for issue #36) then focus will be triggered anyway. Return early and unset the target element reference so that the subsequent click will be allowed through.
    // Case 2: Without this exception for input elements tapped when the document is contained in an iframe, then any inputted text won't be visible even though the value attribute is updated as the user types (issue #37).
    if ((touchEndTime - trackingClickStart) > 100 || (deviceIsIOS && window.top !== window && targetTagName === 'INPUT')) {
      this.targetElement = null;
      return
    }

    this.focus(targetElement);
    this.sendClick(targetElement, event);

    // Select elements need the event to go through on iOS 4, otherwise the selector menu won't open.
    // Also this breaks opening selects when VoiceOver is active on iOS6, iOS7 (and possibly others)
    if (!deviceIsIOS || targetTagName !== 'SELECT') {
      this.targetElement = null;
      event.preventDefault();
    }

    return
  }

  if (deviceIsIOS && !deviceIsIOS4) {

    // Don't send a synthetic click event if the target element is contained within a parent layer that was scrolled
    // and this tap is being used to stop the scrolling (usually initiated by a fling - issue #42).
    scrollParent = targetElement.fastClickScrollParent;
    if (scrollParent && scrollParent.fastClickLastScrollTop !== scrollParent.scrollTop) { return }
  }

  // Prevent the actual click from going though - unless the target node is marked as requiring
  // real clicks or if it is in the whitelist in which case only non-programmatic clicks are permitted.
  if (!this.needsClick(targetElement)) {
    event.preventDefault();
    this.sendClick(targetElement, event);
  }
}

/**
 * On touch cancel, stop tracking the click.
 *
 * @returns {void}
 */
function touchcancel (event) {
  this.trackingClick = false;
  this.targetElement = null;
}

/**
 * Based on a touchmove event object, check whether the touch has moved past a boundary since it started.
 *
 * @param {Event} event
 * @returns {boolean}
 */
function touchHasMoved (event) {
  var touch = event.changedTouches[0];

  return Math.abs(touch.pageX - this.touchStartX) > this.boundary || Math.abs(touch.pageY - this.touchStartY) > this.boundary
}

/**
 * Determine whether a given element requires a call to focus to simulate click into element.
 *
 * @param {EventTarget|Element} target Target DOM element
 * @returns {boolean} Returns true if the element requires a call to focus to simulate native click.
 */
function needsFocus (target) {
  switch (target.nodeName) {
    case 'TEXTAREA':
      return true

    case 'SELECT':
      return !deviceIsAndroid$1

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

/**
 * Determine whether a given element requires a native click.
 *
 * @param {EventTarget|Element} target Target DOM element
 * @returns {boolean} Returns true if the element needs a native click
 */
function needsClick (target) {
  switch (target.nodeName) {
    // Don't send a synthetic click to disabled inputs (issue #62)
    case 'BUTTON':
    case 'SELECT':
    case 'TEXTAREA':
      if (target.disabled) { return true }
      break

    case 'INPUT':
      // File inputs need real clicks on iOS 6 due to a browser bug (issue #68)
      if ((deviceIsIOS && target.type === 'file') || target.disabled) { return true }
      break

    case 'LABEL':
    case 'IFRAME': // iOS8 homescreen apps can prevent events bubbling into frames
    case 'VIDIO':
      return true
  }

  return /\bneedsclick\b/.test(target.className)
}

/**
 * Send a click event to the specified element.
 *
 * @param {EventTarget|Element} targetElement
 * @param {Event} event
 */
function sendClick (targetElement, event) {
  var clickEvent, touch;

  // On some Android devices activeElement needs to be blurred otherwise the synthetic click will have no effect (#24)
  if (document.activeElement && document.activeElement !== targetElement) {
    document.activeElement.blur();
  }

  touch = event.changedTouches[0];

  // Synthesise a click event, with an extra attribute so it can be tracked
  clickEvent = document.createEvent('MouseEvents');

  //Issue #159: Android Chrome Select Box does not open with a synthetic click event
  clickEvent.initMouseEvent(deviceIsAndroid$1 && targetElement.tagName === 'SELECT' ? 'mousedown' : 'click', true, true, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);
  clickEvent.forwardedTouchEvent = true;
  targetElement.dispatchEvent(clickEvent);
}

/**
 * Instantiate fast-clicking listeners on the specified layer.
 *
 * @constructor
 * @param {Element} layer The layer to listen on
 * @param {Object} [options={}] The options to override the defaults
 */
function FastClick (layer, options) {
  if (notNeeded(layer)) { return }
  zUtils.assign(this, options);
  this.layer = layer;
  this.presetEventListener();
}


zUtils.assign(FastClick.prototype, {

  /**
   * Set up event handlers as required
   *
   */
  presetEventListener: function presetEventListener () {
    this.toggleEventListener(true);

    if (FastClick.eventListenerBindSign) {
      this.layer.removeEventListener = FastClick.removeEventListenerBind.bind(this.layer);
      this.layer.addEventListener = FastClick.addEventListenerBind.bind(this.layer);
    }

    // If a handler is already declared in the element's onclick attribute, it will be fired before
    // FastClick's onClick handler. Fix this by pulling out the user-defined handler function and
    // adding it as listener.
    if (typeof this.layer.onclick === 'function') {

      // Android browser on at least 3.2 requires a new reference to the function in layer.onclick
      // - the old one won't work if passed to addEventListener directly.
      this.layer.addEventListener('click', this.layer.onclick.bind(this.layer), false);
      this.layer.onclick = null;
    }
  },


  /**
   * Toggle the layer to listen on.
   *
   * @param {Boolean} add The layer to listen on
   * @returns {void}
   */
  toggleEventListener: function toggleEventListener (add) {
    var this$1 = this;

    presetEventArgs.forEach(function (arg) { return this$1.layer[add ? 'addEventListener' : 'removeEventListener'](arg[0], this$1, arg[1]); });
  },


  /**
   * Remove all FastClick's event listeners.
   *
   * @returns {void}
   */
  destroy: function destroy () {
    this.toggleEventListener(false);
  },

  /**
   * Whether a click is currently being tracked.
   *
   * @type boolean
   */
  trackingClick: false,

  /**
   * Timestamp for when click tracking started.
   *
   * @type number
   */
  trackingClickStart: 0,

  /**
   * The element being tracked for a click.
   *
   * @type EventTarget
   */
  targetElement: null,

  /**
   * X-coordinate of touch start event.
   *
   * @type number
   */
  touchStartX: 0,

  /**
   * Y-coordinate of touch start event.
   *
   * @type number
   */
  touchStartY: 0,

  /**
   * ID of the last touch, retrieved from Touch.identifier.
   *
   * @type number
   */
  lastTouchIdentifier: 0,

  /**
   * Touchmove boundary, beyond which a click will be cancelled.
   *
   * @type number
   */
  touchBoundary: 10,

  /**
   * The FastClick layer.
   *
   * @type Element
   */
  layer: null,

  /**
   * The minimum time between tap(touchstart and touchend) events
   *
   * @type number
   */
  tapDelay: 200,

  /**
   * The maximum time for a tap
   *
   * @type number
   */
  tapTimeout: 700,

  /**
   * https://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-EventListener
   *
   * Introduced in DOM Level 2:
   * interface EventListener {
   *   void handleEvent(in Event evt);
   * };
   *
   * @param {Object} [event] event object
   * @return {Undefined}
   */
  handleEvent: function handleEvent (event) {
    this[event.type] && this[event.type](event);
  },

  click: click,
  mousedown: onMouse,
  mousemove: onMouse,
  mouseup: onMouse,
  touchstart: touchstart,
  touchmove: touchmove,
  touchend: touchend,
  touchcancel: touchcancel,
  touchHasMoved: touchHasMoved,
  needsFocus: needsFocus,
  needsClick: needsClick,
  sendClick: sendClick

});


/**
 * Factory method for creating a FastClick object
 *
 * @param {Element} layer The layer to listen on
 * @param {Object} [options={}] The options to override the defaults
 */
FastClick.attach = function attach (layer, options) {
  return new FastClick(layer, options)
};

FastClick.eventListenerBindSign = null;

// Hack is required for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
// which is how FastClick normally stops click events bubbling to callbacks registered on the FastClick
// layer when they are cancelled.
if (!Event.prototype.stopImmediatePropagation) {

  zUtils.assign(FastClick, {
    eventListenerBindSign: zUtils.uuid(),

    addEventListenerBind: function addEventListenerBind (type, callback, capture) {
      calback && zUtils.referenceTypes[typeof callback] &&
      Node.prototype.addEventListener.call(this, type, type === 'click' && (callback[FastClick.eventListenerBindSign] || (callback[FastClick.eventListenerBindSign] = FastClick.eventListenerBind.bind(this, callback))) || callback, capture);
    },

    removeEventListenerBind: function removeEventListenerBind (type, callback, capture) {
      calback && zUtils.referenceTypes[typeof callback] &&
      Node.prototype.removeEventListener.call(this, type, type === 'click' && callback[FastClick.eventListenerBindSign] || callback, capture);
    },

    eventListenerBind: function eventListenerBind (callback, event) {
      event.propagationStopped ||
      (typeof callback === 'function' ? callback.call(this, event) : (typeof callback.handleEvent === 'function' && callback.handleEvent.call(this, event)));
    }
  });
}

module.exports = FastClick;
