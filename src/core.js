/**
 * Instantiate fast-clicking listeners on the specified layer.
 *
 * @constructor
 * @param {Element} layer The layer to listen on
 * @param {Object} [options={}] The options to override the defaults
 */
function FastClick (layer, options) {
  this.init(layer, options)
}

assign(FastClick.prototype, {

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
  layer: layer,

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
  tapTimeout: 700

})