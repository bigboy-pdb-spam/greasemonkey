// ==UserScript==
// @name         Mississauga Library Login User List
// @description  Add drop down list of users to Mississauga Library login pages
// @version      1.0.0
// @require      https://raw.githubusercontent.com/bigboy-pdb-spam/greasemonkey_scripts/master/config/Mississauga_Library.conf.js
// @grant        none
// @match        https://miss.ent.sirsidynix.net/client/en_*/mlsathome*
// ==/UserScript==

(function() {
  'use strict';

  // DEBUG
  console.log('UserScript: Mississauga Library Login User List');


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

  for (let number of Object.keys(users)) {
    if (typeof(users[number]) !== 'object') {
      throw new Error(`'user[${number}]' is not an object`);
    }

    if (
     typeof(users[number].name) !== 'string' ||
     typeof(users[number].password) !== 'string'
    ) {
      throw new Error(
       `'user[${number}].name' and 'user[${number}].password' must be strings`
      );
    }
  }


  let pageLoginForm = document.getElementById('loginPageFormD');

  let modalLoginForm = document.getElementById('loginModal');
  let modalImg = document.getElementById('loginImageHolder');

  let barcodeElems = document.querySelectorAll('#j_username');
  let passElems = document.querySelectorAll('#j_password');

  let optionsHtml = '';
  for (let number of Object.keys(users)) {
    optionsHtml += `<option value="${number}">${users[number].name}</option>`;
  }

  let pageHtml = `<label for="person">
   <strong>Person:</strong>
  </label>
  <select id="person">
   ${optionsHtml}
   <option value="">Other</option>
  </select>
  <br />`;

  let modalHtml = `<div class="label">
   <label for="person">Person</label>:
  </div>
  <select id="person" class="loginField textbox fullwidth">
   ${optionsHtml}
   <option value="">Other</option>
  </select>
  <br />`;

  pageLoginForm.insertAdjacentHTML('afterBegin', pageHtml);
  modalImg.insertAdjacentHTML('afterend', modalHtml);

  let selectElems = document.querySelectorAll('#person');

  // DEBUG
  //unsafeWindow.pageLoginForm = pageLoginForm;
  //unsafeWindow.modalLoginForm = modalLoginForm;
  //unsafeWindow.selectElems = selectElems;
  //unsafeWindow.barcodeElems = barcodeElems;
  //unsafeWindow.passElems = passElems;

  selectElems.forEach(e => {
    e.addEventListener('change', evt => {
      barcodeElems.forEach(e => {
        e.value = evt.target.value || "";
      });
      passElems.forEach(e => {
        e.value = evt.target.value ? users[evt.target.value].password : "";
      });
      selectElems.forEach(e => {
        e.value = evt.target.value;
      });
    });
  });

  selectElems[0].dispatchEvent(new Event('change'));

  // DEBUG: Click "Log In" link
  //let a = 'a.loginLink';
  //document.querySelector(a).dispatchEvent(new Event('click'));
})();

