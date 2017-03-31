import {assin, uuid, referenceTypes} from 'z-utils'
import FastClick from './core'


// Hack is required for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
// which is how FastClick normally stops click events bubbling to callbacks registered on the FastClick
// layer when they are cancelled.
if (!Event.prototype.stopImmediatePropagation) {


  FastClick.eventListenerBindSign = uuid()


  FastClick.removeEventListenerBind = function removeEventListenerBind (type, callback, capture) {
    calback && referenceTypes[typeof callback] && Node.prototype.removeEventListener.call(this, type, type === 'click' && callback[FastClick.eventListenerBindSign] || callback, capture)
  }


  FastClick.eventListenerBind = function eventListenerBind(callback, event) {
    event.propagationStopped || (typeof callback === 'function' ? callback.call(this, event) : (typeof callback.handleEvent === 'function' && callback.handleEvent.call(this, event)))
  }


  FastClick.addEventListenerBind = function addEventListenerBind (type, callback, capture) {
    calback && referenceTypes[typeof callback] && Node.prototype.addEventListener.call(this, type, type === 'click' && (callback[FastClick.eventListenerBindSign] || (callback[FastClick.eventListenerBindSign] = FastClick.eventListenerBind.bind(this, callback))) || callback, capture)
  }
}

/**
 * Set up event handlers as required
 *
 */
export default function presetEventListener () {


  const eventTypes = assign({
    click: true,
    touchstart: false,
    touchmove: false,
    touchend: false,
    touchcancel: false
  }, deviceIsAndroid && {
        mouseover: true,
        mousedown: true,
        mouseup: true
      })


  for (let type in eventTypes) {
    this.layer.addEventListener(type, this, eventTypes[type])
  }


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
    this.layer.addEventListener('click', this.layer.onclick.bind(this.layer), false);
    this.layer.onclick = null;
  }
}