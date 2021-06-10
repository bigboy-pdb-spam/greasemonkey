// ==UserScript==
// @name         Cloud Library Login User List
// @description  Add drop down list of users to Cloud Library login pages
// @version      1.0.0
// @require      https://raw.githubusercontent.com/bigboy-pdb-spam/user_scripts/dd2671c079dabe62407723f652ac14c80cbbeccc/config/Brampton_Library.conf.js
// @grant        none
// @match        https://ebook.yourcloudlibrary.com/library/brampton_library/*
// ==/UserScript==

(function() {
  'use strict';

  // DEBUG
  console.log('UserScript: Cloud Library Login User List');


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


  const targetNode = document.getElementById('topmodals');
  const observerOptions = { childList: true, attributes: false, subtree: false };

  let optionsHtml = '';
  for (let number of Object.keys(users)) {
    optionsHtml += `<option value="${number}">${users[number].name}</option>`;
  }

  let html = `<div class="flexbox-container-row flexbox-left-justify-items flexbox-flex-wrap flexbox-align-items-center" style="margin-bottom: 10px;">
   <div>
    <label class="mmm-modal-dialog-message" for="person">Person</label>
   </div>
   <div>
    <select id="person" style="width:auto">
     ${optionsHtml}
     <option selected='selected' value="">Other</option>
    </select>
   </div>
  </div>`;

  const observer = new MutationObserver((mutationList, observer) => {
    mutationList.forEach((mutation) => {
      let flexbox = mutation.target.querySelector(
       'main.flexbox-container-column'
      );
      flexbox.insertAdjacentHTML('afterBegin', html);

      let barcodeElem = document.querySelector(
       '[ng-model="LoginService.User.UserId"]'
      );
      let passElem = document.querySelector(
       '[ng-model="LoginService.User.Password"]'
      );

      let selectElem = document.getElementById('person');

      selectElem.addEventListener('change', function() {
        barcodeElem.value = selectElem.value || "";
        barcodeElem.dispatchEvent(new Event('change'));

        passElem.value = selectElem.value ?
         users[selectElem.value].password : "";
        passElem.dispatchEvent(new Event('change'));
      });

      //selectElem.dispatchEvent(new Event('change'));
    });
  });
  observer.observe(targetNode, observerOptions);
})();

