// ==UserScript==
// @name         Duolingo Login User List
// @description  Add drop down list of users to Duolingo login pages
// @version      1.0.0
// @require      https://raw.githubusercontent.com/bigboy-pdb-spam/user_scripts/dd2671c079dabe62407723f652ac14c80cbbeccc/config/Duolingo.conf.js
// @require      https://raw.githubusercontent.com/bigboy-pdb-spam/user_scripts/dd2671c079dabe62407723f652ac14c80cbbeccc/shared/DOMMonitor.class.js
// @grant        none
// @match        https://www.duolingo.com/*
// ==/UserScript==

(function() {
  'use strict';

  // DEBUG
  console.log('UserScript: Duolingo Login User List');


  let users;
  try {
    users = getUsers();
  } catch (e) {
    if (e instanceof ReferenceError) {
      throw new Error("'user' variable was not defined (check relevant @required script) ");
    } else {
      throw e;
    }
  }

  if (typeof(users) !== 'object') {
    throw new Error("'user' variable is not an object (check relevant @required script)");
  }

  for (let email of Object.keys(users)) {
    if (typeof(users[email]) !== 'object') {
      throw new Error(`'user[${email}]' is not an object`);
    }

    if (
     typeof(users[email].name) !== 'string' ||
     typeof(users[email].password) !== 'string'
    ) {
      throw new Error(
       `'user[${email}].name' and 'user[${email}].password' must be strings`
      );
    }
  }


  let userElem, passElem, formHeader;
  let html;


  let domMonitor = new DOMMonitor();
  //domMonitor.DEBUG = true;
  domMonitor.onAdd(document.getElementById('overlays'), 'form', (elem) => {
    domMonitor.DEBUG_MSG('Action: Being performed on:');
    domMonitor.DEBUG_MSG(elem);
    
    let userElem = elem.querySelector('[data-test="email-input"]');
    let passElem = elem.querySelector('[data-test="password-input"]');
    let containerDivElem = elem.querySelector('div:first-child > div');
    
    domMonitor.DEBUG_MSG('Action: Container element:');
    domMonitor.DEBUG_MSG(containerDivElem);
    
    let optionsHtml = '';
    for (let email of Object.keys(users)) {
      optionsHtml += `<option value="${email}">${users[email].name}</option>`;
    }

    let html = `<div>
        <select id="person">
          ${optionsHtml}
          <option selected='selected' value="">Other</option>
        </select>
      </div>

      <style>
      #person {
        padding: 8px 16px;
        width: 100%;

        background-color: rgb(247, 247, 247);

        border: 2px rgb(230, 230, 230) solid;
        border-radius: 15px;
      }
      </style>`;
    
    containerDivElem.insertAdjacentHTML('afterbegin', html);
    
    let selectElem = document.getElementById('person');
    
    selectElem.addEventListener('change', function() {
      
      let evt = new Event('input', { bubbles: true });
      
      
      //
      // Set user name
      //
      
      userElem.value = selectElem.value || "";
      userElem.dispatchEvent(evt);
      
      
      //
      // Set password
      //
      
      passElem.value = selectElem.value ? users[selectElem.value].password : "";
      passElem.dispatchEvent(evt);
    });

    selectElem.dispatchEvent(new Event('change'));
  });
})();

