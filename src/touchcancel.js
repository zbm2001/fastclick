/**
 * On touch cancel, stop tracking the click.
 *
 * @returns {void}
 */
export default function touchcancel (event) {
  this.trackingClick = false
  this.targetElement = null
}