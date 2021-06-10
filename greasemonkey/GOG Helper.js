// ==UserScript==
// @name         GOG Helper
// @description  Alters how products are displayed
// @require      https://raw.githubusercontent.com/bigboy-pdb-spam/greasemonkey_scripts/master/config/GOG.conf.js
// @version      1.3.0
// @grant        GM.setClipboard
// @match        https://www.gog.com/
// @match        https://www.gog.com/*
// ==/UserScript==

(function() {
  'use strict';

  // DEBUG
  console.log('UserScript: GOG Helper');


  //
  // Validate variables in config file
  //

  // Validate 'uninterested' variable
  let uninterested;
  try {
    uninterested = getUninterested();
  } catch (e) {
    if (e instanceof ReferenceError) {
      throw new Error("'uninterested' variable was not defined (check relevant @required script) ");
    } else {
      throw e;
    }
  }

  if (!Array.isArray(uninterested)) {
    throw new Error("'uninterested' variable is not an array");
  }

  for (let i=0; i < uninterested.length; i++) {
    if (typeof(uninterested[i]) !== 'number') {
      throw new Error(`'uninterested[${i}]' is not a number`);
    }
  }

  // Validate 'perhaps' variable
  let perhaps;
  try {
    perhaps = getPerhaps();
  } catch (e) {
    if (e instanceof ReferenceError) {
      throw new Error("'perhaps' variable was not defined (check relevant @required script) ");
    } else {
      throw e;
    }
  }

  if (typeof(perhaps) !== 'object') {
    throw new Error("'perhaps' variable is not an object");
  }

  let numRegex = new RegExp('^[0-9]\+$');
  for (let id of Object.keys(perhaps)) {
    if (!numRegex.exec(id)) {
      throw new Error(`Key '${id}' in 'perhaps' is not a number`);
    } else if (typeof(perhaps[id]) !== 'number') {
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

  let price_ranges;
  try {
    price_ranges = getPriceRanges();
  } catch (e) {
    if (e instanceof ReferenceError) {
      throw new Error("'price_ranges' variable was not defined (check relevant @required script) ");
    } else {
      throw e;
    }
  }

  if (!Array.isArray(price_ranges)) {
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
      
      continue;
    }
    
    for (const num of range(rnge.start, rnge.end, 1)) {
      price_selector += (price_selector ? ', ' : '') +
       `[track-add-to-cart-price^="${num}."]`;
    }
    
    price_range_styles += `${price_selector} { ${rnge.style} } `;
  }


  //
  // Convert list of games that I'm NOT interested in into a set
  //

  let uninterestedSet = new Set();

  for (const id of uninterested) {
    uninterestedSet.add(id+'');
  }


  //
  // Regular expression matching words that imply that content isn't a game
  //  (ie. DLC, upgrades, soundtracks, and demos)
  //

  let uninterestedRegex = new RegExp(
   '\\b('+
    'dlc|expansion|upgrade|OST|soundtrack|'+
    'demo|teaser|prologue|art ?book|'+
    'season pass|pack( [0-9]+)?'+
    ')$',
    'i'
  );


  //
  // Read product IDs and make appropriate chages to products
  //

  let lastIdRead = '';

  function readIds() {
    let intervalId;
    
    intervalId = setInterval(function() {
      console.log('Looking for: product IDs');
      
      let tiles = document.body.querySelectorAll('.product-tile, .product-row');

      // No tiles to load
      if (tiles.length === 0) {
        console.log('No products found');
        clearInterval(intervalId);
        
        return; // DONE
      }

      let allTilesLoaded = true;
      for (let tile of tiles) {
        let id = tile.getAttribute('product-tile-id') ||
          tile.getAttribute('gog-product');

        let lastId = tile.getAttribute('data-last-id');

        allTilesLoaded = allTilesLoaded && id && id !== lastId;
      }
      
      // The last product tile has NOT been read or it has NOT changed
      if (!allTilesLoaded) {
      	return;
      }
      clearInterval(intervalId);
      console.log('Found: product IDs');
      
      for (let tile of tiles) {
        // Remove old classes from the product
        tile.classList.remove('uninterested');
        tile.classList.remove('later');
        tile.classList.remove('reasonable');
      
        let row_price = tile.querySelector('.product-row-price--new ._price');
        if (row_price) {
          tile.setAttribute('track-add-to-cart-price', row_price.innerHTML);
        }
        
        let id = tile.getAttribute('product-tile-id') ||
          tile.getAttribute('gog-product');
        let title = tile.getAttribute('track-add-to-cart-title') ||
          tile.querySelector('span.product-title__text').innerHTML;
        let price = Number(tile.getAttribute('track-add-to-cart-price'));
        let reasonablePrice = Number(perhaps[id]);

        tile.setAttribute('data-last-id', id);
        
        // I'm not interested in the product
        if (uninterestedSet.has(id)) {
          tile.classList.add('uninterested');
          
        // It's likely that I'm not interested in the product
        } else if (title.match(uninterestedRegex)) {
          tile.classList.add('likely-uninterested');
          
        // I might purchase the prduct for a reasonable price
        } else if ((id in perhaps) && reasonablePrice) {
          tile.classList.add('later');
          
          // Price is reasonable
          if (price <= reasonablePrice) {
            tile.classList.add('reasonable');
          }
        }
      }
      
      console.log('Finished with: product IDs');
    }, 1500);
  }
  readIds();


  //
  // Event listeners
  //

  // Copy product id and title formatted as 'ID // TITLE' to the clipboard when a product is hovered over with the mouse
  document.body.addEventListener('mousemove', (evt) => {
    let product = {};
    
    // The mouse is hovering over a product square
    if (evt.target.matches('[class*="product-tile"]')) {
      let productTileElem = evt.target;
      while (productTileElem && !productTileElem.matches('[product-tile-id]')) {
        productTileElem = productTileElem.parentElement;
      }

      product = {
        id: productTileElem.attributes['product-tile-id'].value - 0,
        price: productTileElem.attributes['track-add-to-cart-price'].value - 0,
        title: productTileElem.attributes['track-add-to-cart-title'].value
      };
    
    // The mouse is hovering over a product row
    } else if (evt.target.matches('[class*="product-row"]')) {
      let productRowElem = evt.target;
      while (productRowElem && !productRowElem.matches('[gog-product]')) {
        productRowElem = productRowElem.parentElement;
      }
      
      product = {
        id: productRowElem.getAttribute('gog-product') - 0,
        title: productRowElem.querySelector('span.product-title__text').innerHTML
      };
      
    } else {
      return; // ABORT
    }
    
    GM.setClipboard(`${product.id}, // ${product.title}`);
  });


  // The document body was clicked on
  document.body.addEventListener('click', function(evt) {
    // A page number was clicked on (the page was changed)
    if (
     evt.target.classList.contains('page-index-wrapper') &&
     evt.target.classList.contains('page-indicator--inactive')
    ) {
      readIds();
    }
  });


  //
  // Append styles to document body
  //


  document.body.insertAdjacentHTML('beforeend',
   `<style>
   /* Change visibility of games based on prices */

   ${price_range_styles}


   /* Change visibility of games that I might get later (and of those that are
    cheaper) */

   .later { background-color: purple; opacity: 0.2; }
   .later.reasonable { opacity: 1; }


   /* Hide content that I am uninterested in */
   .uninterested { opacity: 0.1; }

   /* Hide content that I'm likely not interested in */
   .likely-uninterested { opacity: 0.2; }
   </style>`
  );
})();

