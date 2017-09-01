import {deviceIsIOS} from './CONST'


const dateTypes = {
  date: !0,
  week: !0,
  month: !0,
  time: !0,
  datetime: !0,
  'datetime-local': !0
}

/**
 * @param {EventTarget|Element} targetElement
 */
export default function focus (targetElement) {
  let length

  // Issue #160: on iOS 7, some input elements (e.g. date datetime month) throw a vague TypeError on setSelectionRange.
  // These elements don't have an integer value for the selectionStart and selectionEnd properties,
  // but unfortunately that can't be used for detection because accessing the properties also throws a TypeError.
  // Just check the type instead. Filed as Apple bug #15122724.
  if (deviceIsIOS && targetElement.setSelectionRange && !dateTypes[targetElement.type]) {
    length = targetElement.value.length
    targetElement.setSelectionRange(length, length)
  } else {
    targetElement.focus()
  }
}