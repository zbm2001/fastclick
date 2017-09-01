/**
 * Based on a touchmove event object, check whether the touch has moved past a boundary since it started.
 *
 * @param {Event} event
 * @returns {boolean}
 */
export default function touchHasMoved (event) {
  var touch = event.changedTouches[0]

  return Math.abs(touch.pageX - this.touchStartX) > this.boundary || Math.abs(touch.pageY - this.touchStartY) > this.boundary
}