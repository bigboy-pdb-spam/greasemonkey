//
// Simplifies monitoring changes to the DOM
//
class DOMMonitor {
  _className = 'DOMMonitor';

  static _DEBUG = false;

  // Hash mapping ids onto monitor objects
  _monitors = {};

  constructor() { }

  set DEBUG(val) {
    DOMMonitor._DEBUG = val;

    this.DEBUG_MSG('Debugging is enabled');
  }

  get DEBUG() {
    return DOMMonitor._DEBUG;
  }

  //
  // Adds an action to be performed on the descendents that match the selector
  //  for an element and returns the observer for it.
  //
  // monitorElem is the element that is being monitored.
  // selector is a CSS selector that identifies the descendant elements that
  //  have been modified.
  // action is the action to be performed on the added descendant elements
  //  that match the given selector.
  //
  onAdd(monitorElem, selector, action) {
	if (!(monitorElem instanceof HTMLElement)) {
      throw new Error(
       `${this._className}: onAdd: monitorElem must be a DOM element`
      );

	} else if (typeof(selector) !== 'string') {
      throw new Error(
       `${this._className}: onAdd: selector must be a CSS selector`
      );

	} else if (typeof(action) !== 'function') {
      throw new Error(
       `${this._className}: onAdd: action must be a function`
      );
	}

    // Add existing elements that match the given selector
    let elems = monitorElem.querySelectorAll(selector);
    if (elems.length > 0) {
      this.DEBUG_MSG('onAdd', `Elements found with selector '${selector}':`);
      this.DEBUG_MSG(elems);

      elems = Array.from(elems);
    }

    // Run action on existing elements
    for (const elem of elems) {
      this.DEBUG_MSG('onAdd', 'Performing action on existing element:');
      this.DEBUG_MSG(elem);

      action(elem);
    }

    const observer = new MutationObserver((mutationsList, observer) => {
      for (const mutation of mutationsList) {
        for (const node of mutation.addedNodes) {
          let matchedElems = node.querySelectorAll(selector);

          if (matchedElems.length > 0) {
            this.DEBUG_MSG('onAdd', 'Matched list of elements:');
            this.DEBUG_MSG(matchedElems);
          }

          for (const matchedElem of matchedElems) {

            this.DEBUG_MSG('onAdd', 'matchedElement:');
            this.DEBUG_MSG(matchedElem);

            let isNew = true;

            for (const prevFoundElem of elems) {
              // Element that was matched with the selector was previously
              //  matched
              if (!(isNew = matchedElem !== prevFoundElem)) {
                break;
              }
            }

            // Element that was matched with the selector was previously matched
            if (!isNew) {
              this.DEBUG_MSG('onAdd', 'Matched element was previously found.');

              continue; // SKIP
            }

            this.DEBUG_MSG('onAdd', 'Matched element is new.');

            action(matchedElem);

            elems.push(matchedElem);
          }
        }
      }
    });

    const config = { attributes: false, childList: true, subtree: true };
    observer.observe(monitorElem, config);

    return observer;
  }

  deregister(id) {
    this._monitors[id].observer.disconnect();

    return this;
  }

  DEBUG_MSG(funct, msg) {
    if (!DOMMonitor._DEBUG) {
      return; // ABORT
    }

    // Function and message are strings
    if (typeof funct === 'string' && typeof msg === 'string') {
      console.log(this._className + (funct ? '.'+funct : '') +': '+ msg);

    // Function can be converted to a string
    } else if (typeof funct !== 'object') {
      msg = funct; // The function was the message

      console.log(this._className +': '+ msg);

    // Neither the function or message was a string
    } else {
      console.log(funct);
    }
  }
}
