// ==UserScript==
// @name         GOG Helper
// @description  Alters how products are displayed
// @require      https://raw.githubusercontent.com/bigboy-pdb-spam/greasemonkey_scripts/master/config/GOG.conf.js
// @version      1.0.0
// @grant        none
// @match        https://www.gog.com/
// @match        https://www.gog.com/*
// ==/UserScript==

// DEBUG
console.log('Greasemonkey: UserScript: GOG Helper');


//
// Validate variables in config file
//

// Validate 'uninterested' variable
if (typeof(uninterested) === 'undefined') {
  throw new Error("'uninterested' variable was not defined");
  
} else if (!Array.isArray(uninterested)) {
  throw new Error("'uninterested' variable is not an array");
}

for (let i=0; i < uninterested.length; i++) {
  if (typeof(uninterested[i]) !== 'number') {
    throw new Error(`'uninterested[${i}]' is not a number`);
  }
}

// Validate 'perhaps' variable
if (typeof(perhaps) === 'undefined') {
  throw new Error("'perhaps' variable was not defined");
  
} else if (!Array.isArray(perhaps)) {
  throw new Error("'perhaps' variable is not an array");
}

for (let i=0; i < perhaps.length; i++) {
  if (typeof(perhaps[i]) !== 'number') {
    throw new Error(`'perhaps[${i}]' is not a number`);
  }
}

// Validate 'price_ranges' variable
function hasValidRange(o) {
  return typeof(o.start) === 'number' && typeof (o.end) === 'number' &&
   o.start <= o.end;
}

function hasRange(o) {
  return typeof(o.start) !== 'undefined' && typeof(o.end) !== 'undefined';
}

if (typeof(price_ranges) === 'undefined') {
  throw new Error("'price_ranges' variable was not defined");
  
} else if (!Array.isArray(price_ranges)) {
  throw new Error("'price_ranges' variable is not an array");
}

for (let i=0; i < price_ranges.length; i++) {
  if (typeof(price_ranges[i]) !== 'object') {
    throw new Error(`'price_ranges[${i}]' is not an object`);
    
  } else if (typeof(price_ranges[i].style) !== 'string') {
    throw new Error(`'price_ranges[${i}].style' must be a CSS style`);
    
  } else if (
   i === 0 && hasRange(price_ranges[i]) && !hasValidRange(price_ranges[i])
  ) {
    throw new Error(
     `'price_ranges[0]' must have either no range or a valid range`
    );
    
  } else if (i > 0 && !hasValidRange(price_ranges[i])) {
    throw new Error(`'price_ranges[${i}]' must have a valid range`);
  }
}

// Validate 'perhaps_max' variable
if (typeof(perhaps_max) === 'undefined') {
  throw new Error("'perhaps_max' variable was not defined");
  
} else if (typeof(perhaps_max) !== 'number') {
  throw new Error("'perhaps_max' variable is not a number");
}



/*

//
// Code to extract product (game) information (MUST BE PASTED INTO THE CONSOLE)
//


function extractProductData() {
  let products = document.querySelectorAll('[product-tile-id]');
  for (const p of products) {
    let product = {
      id: p.attributes['product-tile-id'].value - 0,
      price: p.attributes['track-add-to-cart-price'].value - 0,
      title: p.attributes['track-add-to-cart-title'].value
    };
    
    console.log(product.id + ', // ' + product.title);
  }
} extractProductData()

*/


//
// Generate CSS selectors for the maximum price allowed
//


const range = (start, stop, step) =>
 Array.from({ length: (stop - start) / step + 1}, (_, i) => start + (i * step));


let price_range_styles = '';

for (const rnge of price_ranges) {
  let price_selector = '';

  // A starting or ending range was NOT specified
  if (!hasRange(rnge)) {
    price_range_styles += `[track-add-to-cart-price] { ${rnge.style} } `;
  }
  
  for (const num of range(rnge.start, rnge.end, 1)) {
    price_selector += (price_selector ? ', ' : '') +
     `[track-add-to-cart-price^="${num}."]`;
  }
  
  price_range_styles += `${price_selector} { ${rnge.style} } `;
}


//
// Generate CSS selectors for games that I'm not interested in
//


let uninterested_selector = '';

for (const id of uninterested) {
  // For store page
  uninterested_selector += (uninterested_selector ? ', ' : '') +
   `[product-tile-id="${id}"]`;
}

// By default include games that I might get later
for (const id of perhaps) {
  // For store page
  uninterested_selector += (uninterested_selector ? ', ' : '') +
   `[product-tile-id="${id}"]`;
}


//
// Generate CSS selectors for games that I might gat later (at a lower price)
//


let perhaps_selector = '';
let cheap_perhaps_selector = '';

for (const id of perhaps) {
    // For store page
    perhaps_selector += (perhaps_selector ? ', ' : '') +
     `[product-tile-id="${id}"]`;
}

// Make games that I might get later that are less than the maximum value that
//  I am willing to spend visible
for (const id of perhaps) {
  for (let i = 0; i <= perhaps_max; i++) {
    // For store page
    cheap_perhaps_selector += (cheap_perhaps_selector ? ', ' : '') +
     `[product-tile-id="${id}"][track-add-to-cart-price^="${i}."]`;
  }
}


//
// Append styles to document body
//


document.body.insertAdjacentHTML('beforeend',
 `<style>

 button.copy-id {
   border: solid;
   padding: 3px;
 }

 /* Change visibility of games based on prices */

 ${price_range_styles}


 /* Change visibility of games that I might get later (and of those that are
  cheaper) */

 ${perhaps_selector} { background-color: purple; opacity: 0.2; }
 ${cheap_perhaps_selector} { opacity: 1; }


 /* Hide DLCs, extra content, demos, and games that I am uninterested in */

 [track-add-to-cart-title~="dlc" i],
 [track-add-to-cart-title~="expansion" i],
 [track-add-to-cart-title~="upgrade" i],

 [track-add-to-cart-title~="OST" i],
 [track-add-to-cart-title~="soundtrack" i],
 
 [track-add-to-cart-title~="demo" i],
 [track-add-to-cart-title~="teaser" i],
 [track-add-to-cart-title~="prologue" i],

 ${uninterested_selector}
 {
   opacity: 0.1;
 }
 
 </style>`
);
