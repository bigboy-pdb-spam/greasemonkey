// ==UserScript==
// @name         Remove adblock exception request from The Weather Network
// @description  Removes adblock exception request from The Weather Network
// @version      1.0.0
// @grant        none
// @match        https://www.theweathernetwork.com/*
// ==/UserScript==

const config = { attributes: false, childList: true, subtree: false };

const observer = new MutationObserver(function(mutationList, observer) {
  for (var i=0; i < mutationList.length; i++) {
    let mutation = mutationList[i];
    
    for (var j=0; mutation.addedNodes && j < mutation.addedNodes.length; j++) {
      let addedNode = mutation.addedNodes[j];
      
      // Node that was added was not the parent element of adblock dialog
      if (!addedNode.classList.contains('fc-ab-root')) {
        continue;
      }
      
      // Dialog asking for adblock exception to be made
      let ad = document.querySelector('.fc-dialog-container');
      
      if (ad) {
        ad.remove();
      }
      
      observer.disconnect();
    }
  }
});
observer.observe(document.body, config);