/**
 * @param {EventTarget} eventTarget
 * @returns {Element|EventTarget}
 */
export default function getTargetElementFromEventTarget (eventTarget) {

  // On some older browsers (notably Safari on iOS 4.1 - see issue #56) the event target may be a text node.
  return eventTarget.nodeType !== Node.TEXT_NODE ? eventTarget : eventTarget.parentNode
}