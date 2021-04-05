// ==UserScript==
// @name         Debugger
// @description  Helps with debugging scripts
// @version      1.0.0
// @grant        none
// @match        https://*/*
// ==/UserScript==


const GM_SCRIPT_Debugger_ENABLED = false;

//
// Listen for events in document body (for debugging input events)
//

Object.keys(window).forEach(key => {
  if (!GM_SCRIPT_Debugger_ENABLED) {
    return; // ABORT
  }
  
  if (
  	// Ignore window keys that are NOT events
    !/^on/.test(key) ||
    
    // Ignore pointer, mouse, wheel, and transition events
    /^on(pointer|mouse|wheel|transition|animation)/.test(key)
  ) {
    return; // SKIP
  }
  
  // List all events that can be listened to
  //console.log(key);
    
  document.body.addEventListener(key.slice(2), event => {
    console.log('Event');
    console.log(event);
  });
});
