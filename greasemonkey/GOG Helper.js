// ==UserScript==
// @name         GOG Helper
// @description  Alters how products are displayed
// @require      https://raw.githubusercontent.com/bigboy-pdb-spam/user_scripts/dd2671c079dabe62407723f652ac14c80cbbeccc/config/GOG.conf.js
// @version      1.3.3
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
      
        let row_price = tile.querySelector('.product-row-price--new ._price, .price-btn ._price');
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
   .product-tile__title, .product-tile__prices,
   .product-row__title, .product-row__price
    { background-color: rgba(255,255,255,0.6);}

   /* Change visibility of games based on prices */

   [track-add-to-cart-price], [track-add-to-cart-price] .product-tile__info { background-color: red; }
   [track-add-to-cart-price] { opacity: 0.15 }

   [track-add-to-cart-price^="0."], [track-add-to-cart-price^="0."] .product-tile__info,
   [track-add-to-cart-price^="1."], [track-add-to-cart-price^="1."] .product-tile__info,
   [track-add-to-cart-price^="2."], [track-add-to-cart-price^="2."] .product-tile__info,
   [track-add-to-cart-price^="3."], [track-add-to-cart-price^="3."] .product-tile__info
   { background-color: green; }

   [track-add-to-cart-price^="4."], [track-add-to-cart-price^="4."] .product-tile__info,
   [track-add-to-cart-price^="5."], [track-add-to-cart-price^="5."] .product-tile__info,
   [track-add-to-cart-price^="6."], [track-add-to-cart-price^="6."] .product-tile__info,
   [track-add-to-cart-price^="7."], [track-add-to-cart-price^="7."] .product-tile__info
   { background-color: yellow; }

   
   /* Change visibility of games that I might get later (and of those that are
    cheaper) */

   .later, .later .product-tile__info { background-color: purple; }
   .later .product-tile__title, .later .product-tile__prices { background-color: rgba(255,255,255,1); }
   .later { opacity: 0.3; }
   .later.reasonable { opacity: 1; }


   /* Content that I am uninterested in */
   .uninterested, .uninterested .product-tile__info { background-color: black; }
   .uninterested { opacity: 0.2; }

   /* Content that I'm likely not interested in */
   .likely-uninterested, .likely-uninterested .product-tile__info { background-color: purple; }
   .likely-uninterested { opacity: 0.2; }
   </style>`
  );
})();

