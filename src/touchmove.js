/**
 * Update the last position.
 *
 * @param {Event} event
 * @returns {boolean}
 */
export default function touchmove (event) {
  // If the touch has moved, cancel the click tracking
  if (this.trackingClick && (this.targetElement === (event.target.nodeType !== Node.TEXT_NODE ? event.target : event.target.parentNode) || this.touchHasMoved(event))) {
    this.trackingClick = false
    this.targetElement = null
  }
}