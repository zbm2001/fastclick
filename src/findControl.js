import {deviceIsIOS} from './CONST'


/**
 * Attempt to find the labelled control for the given label element.
 *
 * @param {EventTarget|HTMLLabelElement} labelElement
 * @returns {Element|null}
 */
export default ('control' in document.createElement('label')
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
    })