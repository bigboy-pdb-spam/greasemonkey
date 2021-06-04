// ==UserScript==
// @name         Prodigy Login User List
// @description  Add drop down list of users to Prodigy game login pages
// @version      1.0.0
// @require      file://./config/Prodigy.conf.js
// @grant        none
// @match        https://sso.prodigygame.com/game/login*
// ==/UserScript==

(function() {
  'use strict';

  // DEBUG
  console.log('Tampermonkey: UserScript: Prodigy Login User List');


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


  let nameContainerElem = document.querySelector(
   '.game-login-username-container'
  );

  let nameElem = document.getElementById(
   'unauthenticated_game_login_form_username'
  );
  let passElem = document.getElementById(
  'unauthenticated_game_login_form_password'
  );

  let optionsHtml = '';
  for (let number of Object.keys(users)) {
    optionsHtml += `<option value="${number}">${users[number].name}</option>`;
  }

  let html = `<div class="game-login-user-container">
   <label class="user-label" for="user-dropdown-list">
    User
   </label>
   <select id="user-dropdown-list">
    ${optionsHtml}
    <option selected='selected' value="">Other</option>
   </select>
  </div>

  <style>
  .game-login-user-container {
   margin-bottom: 12px;
  }

  .user-label {
   font-family: 'ABeeZee', sans-serif;
   line-height: 1;
   font-size: 16px;
   margin-bottom: 5px;
  }

  #user-dropdown-list {
   border-radius: 4px;
   padding: 12px 8px 7px 8px;
   font-size: 14px;
   font-family: 'ABeeZee', sans-serif;
   background-color: #fafafa;
   display: block;
   width: 100%;
  }
  </style>`;

  nameContainerElem.insertAdjacentHTML('beforeBegin', html);

  let selectElem = document.getElementById('user-dropdown-list');

  selectElem.addEventListener('change', function() {
    nameElem.value = selectElem.value || "";
    passElem.value = selectElem.value ? users[selectElem.value].password : "";
  });

  selectElem.dispatchEvent(new Event('change'));
})();

