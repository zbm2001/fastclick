import {userAgent, deviceIsAndroid, deviceIsBlackBerry10} from './CONST'


/**
 * Check whether FastClick is needed.
 *
 * @param {Element} layer The layer to listen on
 */
FastClick.notNeeded = function(layer) {
  let metaViewport,
    chromeVersion,
    blackberryVersion,
    firefoxVersion

  // Devices that don't support touch don't need FastClick
  if (typeof window.ontouchstart === 'undefined') {
    return true
  }

  // Chrome version - zero for other browsers
  chromeVersion = /Chrome\/([0-9]+)/.test(userAgent) && RegExp.$1

  if (chromeVersion) {

    if (deviceIsAndroid) {
      metaViewport = document.querySelector('meta[name=viewport]')

      if (metaViewport) {
        // Chrome on Android with user-scalable="no" doesn't need FastClick (issue #89)
        if (metaViewport.content.indexOf('user-scalable=no') > -1) {
          return true
        }
        // Chrome 32 and above with width=device-width or less don't need FastClick
        if (chromeVersion > 31 && document.documentElement.scrollWidth <= window.outerWidth) {
          return true
        }
      }

      // Chrome desktop doesn't need FastClick (issue #15)
    } else {
      return true
    }
  }

  if (deviceIsBlackBerry10) {
    blackberryVersion = userAgent.match(/Version\/([0-9]*)\.([0-9]*)/)

    // BlackBerry 10.3+ does not require Fastclick library.
    // https://github.com/ftlabs/fastclick/issues/251
    if (blackberryVersion[1] >= 10 && blackberryVersion[2] >= 3) {
      metaViewport = document.querySelector('meta[name=viewport]')

      if (metaViewport) {
        // user-scalable=no eliminates click delay.
        if (metaViewport.content.indexOf('user-scalable=no') > -1) {
          return true
        }
        // width=device-width (or less than device-width) eliminates click delay.
        if (document.documentElement.scrollWidth <= window.outerWidth) {
          return true
        }
      }
    }
  }

  // IE10 with -ms-touch-action: none or manipulation, which disables double-tap-to-zoom (issue #97)
  if (layer.style.msTouchAction === 'none' || layer.style.touchAction === 'manipulation') {
    return true
  }

  // Firefox version - zero for other browsers
  firefoxVersion = /Firefox\/([0-9]+)/.exec(userAgent) && RegExp.$1

  if (firefoxVersion >= 27) {
    // Firefox 27+ does not have tap delay if the content is not zoomable - https://bugzilla.mozilla.org/show_bug.cgi?id=922896

    metaViewport = document.querySelector('meta[name=viewport]')
    if (metaViewport && (metaViewport.content.indexOf('user-scalable=no') > -1 || document.documentElement.scrollWidth <= window.outerWidth)) {
      return true
    }
  }

  // IE11: prefixed -ms-touch-action is no longer supported and it's recomended to use non-prefixed version
  // http://msdn.microsoft.com/en-us/library/windows/apps/Hh767313.aspx
  if (layer.style.touchAction === 'none' || layer.style.touchAction === 'manipulation') {
    return true
  }

  return false
}