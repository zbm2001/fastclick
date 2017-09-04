import {assign, uuid, referenceTypes} from 'z-utils'
import {presetEventArgs} from './CONST'
import notNeeded from './notNeeded'
import click from './click'
import onMouse from './onMouse'
import touchstart from './touchstart'
import touchmove from './touchmove'
import touchend from './touchend'
import touchcancel from './touchcancel'
import touchHasMoved from './touchHasMoved'
import needsFocus from './needsFocus'
import needsClick from './needsClick'
import sendClick from './sendClick'


/**
 * Instantiate fast-clicking listeners on the specified layer.
 *
 * @constructor
 * @param {Element} layer The layer to listen on
 * @param {Object} [options={}] The options to override the defaults
 */
export default function FastClick (layer, options) {
  this.init(layer, options)
}


assign(FastClick.prototype, {

  /**
   * Whether a click is currently being tracked.
   *
   * @type boolean
   */
  init (layer, options) {
    assign(this, options)
    this.layer = layer
    if (notNeeded(layer)) this.presetEventListener()
  },

  /**
   * Set up event handlers as required
   *
   */
  presetEventListener () {
    this.toggleEventListener(true)

    if (FastClick.eventListenerBindSign) {
      this.layer.removeEventListener = FastClick.removeEventListenerBind.bind(this.layer)
      this.layer.addEventListener = FastClick.addEventListenerBind.bind(this.layer)
    }

    // If a handler is already declared in the element's onclick attribute, it will be fired before
    // FastClick's onClick handler. Fix this by pulling out the user-defined handler function and
    // adding it as listener.
    if (typeof this.layer.onclick === 'function') {

      // Android browser on at least 3.2 requires a new reference to the function in layer.onclick
      // - the old one won't work if passed to addEventListener directly.
      this.layer.addEventListener('click', this.layer.onclick.bind(this.layer), false)
      this.layer.onclick = null
    }
  },


  /**
   * Toggle the layer to listen on.
   *
   * @param {Boolean} add The layer to listen on
   * @returns {void}
   */
  toggleEventListener (add) {
    presetEventArgs.forEach(arg => this.layer[add ? 'addEventListener' : 'removeEventListener'](arg[0], this, arg[1]))
  },


  /**
   * Remove all FastClick's event listeners.
   *
   * @returns {void}
   */
  destroy () {
    this.toggleEventListener(false)
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
  handleEvent (event) {
    this[event.type] && this[event.type](event)
  },

  click,
  mousedown: onMouse,
  mousemove: onMouse,
  mouseup: onMouse,
  touchstart,
  touchmove,
  touchend,
  touchcancel,
  touchHasMoved,
  needsFocus,
  needsClick,
  sendClick

})


/**
 * Factory method for creating a FastClick object
 *
 * @param {Element} layer The layer to listen on
 * @param {Object} [options={}] The options to override the defaults
 */
FastClick.attach = function attach (layer, options) {
  return new FastClick(layer, options)
}

FastClick.eventListenerBindSign = null

// Hack is required for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
// which is how FastClick normally stops click events bubbling to callbacks registered on the FastClick
// layer when they are cancelled.
if (!Event.prototype.stopImmediatePropagation) {

  assign(FastClick, {
    eventListenerBindSign: uuid(),

    addEventListenerBind (type, callback, capture) {
      calback && referenceTypes[typeof callback] &&
      Node.prototype.addEventListener.call(this, type, type === 'click' && (callback[FastClick.eventListenerBindSign] || (callback[FastClick.eventListenerBindSign] = FastClick.eventListenerBind.bind(this, callback))) || callback, capture)
    },

    removeEventListenerBind (type, callback, capture) {
      calback && referenceTypes[typeof callback] &&
      Node.prototype.removeEventListener.call(this, type, type === 'click' && callback[FastClick.eventListenerBindSign] || callback, capture)
    },

    eventListenerBind (callback, event) {
      event.propagationStopped ||
      (typeof callback === 'function' ? callback.call(this, event) : (typeof callback.handleEvent === 'function' && callback.handleEvent.call(this, event)))
    }
  })
}
