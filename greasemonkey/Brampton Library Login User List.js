// ==UserScript==
// @name         Brampton Library Login User List
// @description  Add drop down list of users to Brampton Library login pages
// @version      1.0.0
// @require      https://raw.githubusercontent.com/bigboy-pdb-spam/greasemonkey_scripts/master/config/Brampton_Library.conf.js
// @grant        none
// @match        https://catalogue.bramlib.on.ca/polaris/logon.aspx*
// @match        https://catalogue.bramlib.on.ca/polaris/Search/request.aspx*
// ==/UserScript==

// DEBUG
console.log('Greasemonkey: UserScript: Brampton Library Login User List');


// Validate user variable
if (typeof(users) === 'undefined') {
  throw new Error("'user' variable was not defined");
  
} else if (typeof(users) !== 'object') {
  throw new Error("'user' variable is not an object");
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


let barcodeElem = document.getElementById('textboxBarcodeUsername');
let passElem = document.getElementById('textboxPassword');
let tblLogonBodyElem = barcodeElem.parentElement.parentElement.parentElement;

let optionsHtml = '';
for (let number of Object.keys(users)) {
  optionsHtml += `<option value="${number}">${users[number].name}</option>`;
}

let html = `<tr>
 <td align="right">
  <label for="person" style="font-weight: bold;">Person:</label>
 </td>
 <td align="left">
  <select id="person" class="form-control">
   ${optionsHtml}
   <option selected='selected' value="">Other</option>
  </select>
 </td>
</tr>

<tr><td colspan="2">&nbsp;</td></tr>

<style>
#person {
 font-family: "Roboto", "Helvetica", "Arial", sans-serif;
 font-weight: 300;
 color: #333333;
 padding: 6px;
}
</style>`;

tblLogonBodyElem.insertAdjacentHTML('afterBegin', html);

let selectElem = document.getElementById('person');

selectElem.addEventListener('change', function() {
  barcodeElem.value = selectElem.value || "";
  passElem.value = selectElem.value ? users[selectElem.value].password : "";
});

selectElem.dispatchEvent(new Event('change'));

