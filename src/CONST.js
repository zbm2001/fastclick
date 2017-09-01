
export const userAgent = window.navigator.userAgent


/**
 * Windows Phone 8.1 fakes user agent string to look like Android and iPhone.
 *
 * @type boolean
 */
export const deviceIsWindowsPhone = userAgent.indexOf("Windows Phone") > -1


/**
 * Android requires exceptions.
 *
 * @type boolean
 */
export const deviceIsAndroid = userAgent.indexOf('Android') > 0 && !deviceIsWindowsPhone


/**
 * iOS requires exceptions.
 *
 * @type boolean
 */
export const deviceIsIOS = /iP(ad|hone|od)/.test(userAgent) && !deviceIsWindowsPhone


/**
 * iOS 4 requires an exception for select elements.
 *
 * @type boolean
 */
export const deviceIsIOS4 = deviceIsIOS && /OS 4_\d(_\d)?/.test(userAgent)


/**
 * iOS 6.0-7.* requires the target element to be manually derived
 *
 * @type boolean
 */
export const deviceIsIOSWithBadTarget = deviceIsIOS && /OS [6-7]_\d/.test(userAgent)


/**
 * BlackBerry requires exceptions.
 *
 * @type boolean
 */
export const deviceIsBlackBerry10 = userAgent.indexOf('BB10') > 0


/**
 * BlackBerry requires exceptions.
 *
 * @type boolean
 */
export const presetEventArgs = [
  ['click', !0],
  ['touchstart', !1],
  ['touchmove', !1],
  ['touchend', !1],
  ['touchcancel', !1]
  // Set up event handlers as required
].concat(deviceIsAndroid ? [
  ['mouseover', !0],
  ['mousedown', !0],
  ['mouseup', !0]
] : [])
