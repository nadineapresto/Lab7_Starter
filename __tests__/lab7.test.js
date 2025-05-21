const { resolvePlugin } = require("@babel/core");
const { createTestScheduler } = require("jest");

describe('Basic user flow for Website', () => {
  // First, visit the lab 7 website
  beforeAll(async () => {
    await page.goto('https://cse110-sp25.github.io/CSE110-Shop/');
  });

  // Each it() call is a separate test
  // Here, we check to make sure that all 20 <product-item> elements have loaded
  it('Initial Home Page - Check for 20 product items', async () => {
    console.log('Checking for 20 product items...');

    // Query select all of the <product-item> elements and return the length of that array
    const numProducts = await page.$$eval('product-item', (prodItems) => {
      return prodItems.length;
    });

    // Expect there that array from earlier to be of length 20, meaning 20 <product-item> elements where found
    expect(numProducts).toBe(20);
  });

  // Check to make sure that all 20 <product-item> elements have data in them
  // We use .skip() here because this test has a TODO that has not been completed yet.
  // Make sure to remove the .skip after you finish the TODO. 
  it('Make sure <product-item> elements are populated', async () => {
    console.log('Checking to make sure <product-item> elements are populated...');

    // Start as true, if any don't have data, swap to false
    let allArePopulated = true;

    // Query select all of the <product-item> elements
    const prodItems = await page.$$('product-item');

    for(let i = 0; i < prodItems.length; i++) {
      console.log(`Checking product item ${i + 1}/${prodItems.length}`);

      const isPopulated = await page.evaluate((element) => {
        const data = element.data;
        return data && data.title && data.price && data.image;
      }, prodItems[i]);
      
      if(!isPopulated) {
        allArePopulated = false;
        break;
      }
    }

    // Expect allArePopulated to still be true
    expect(allArePopulated).toBe(true);
  }, 10000);

  // Check to make sure that when you click "Add to Cart" on the first <product-item> that
  // the button swaps to "Remove from Cart"
  it('Clicking the "Add to Cart" button should change button text', async () => {
    console.log('Checking the "Add to Cart" button...');

    // Get the first product-item element
    const productItem = await page.$('product-item');

    // Get the shadowRoot of the product-item
    const shadowRoot = await productItem.getProperty('shadowRoot');

    // Get button inside shadowRoot
    const button = await shadowRoot.$('button');

    // Click button
    await button.click();

    // Get innerText of button after click
    const buttonTextHandle = await button.getProperty('innerText');
    const buttonText = await buttonTextHandle.jsonValue();

    // Expect textt o be "Remove from Cart"
    expect(buttonText).toBe('Remove from Cart');
  }, 2500);

  // Check to make sure that after clicking "Add to Cart" on every <product-item> that the Cart
  // number in the top right has been correctly updated
  it('Checking number of items in cart on screen', async () => {
    console.log('Checking number of items in cart on screen...');

    const prodItems = await page.$$('product-item');

    // Skip first item, already clicked in Step 2
    for(let i = 1; i < prodItems.length; i++) {
      const shadowRoot = await prodItems[i].getProperty('shadowRoot');
      const button = await shadowRoot.$('button');
      await button.click();
      await new Promise(resolve => setTimeout(resolve, 100)); // Add delay after each click
    }

    const cartCountHandle = await page.$('#cart-count');
    const cartCountText = await cartCountHandle.getProperty('innerText');
    const cartCount = await cartCountText.jsonValue();

    expect(cartCount).toBe('20');
  }, 100000);

  // Check to make sure that after you reload the page it remembers all of the items in your cart
  it('Checking number of items in cart on screen after reload', async () => {
    console.log('Checking number of items in cart on screen after reload...');

    await page.reload({waitUntil: ['networkidle0', 'domcontentloaded']});

    const prodItems = await page.$$('product-item');
    let allButtonsCorrect = true;

    for(let i = 0; i < prodItems.length; i++) {
      const shadowRoot = await prodItems[i].getProperty('shadowRoot');
      const button = await shadowRoot.$('button');
      const buttonTextHandle = await button.getProperty('innerText');
      const buttonText = await buttonTextHandle. jsonValue();

      if(buttonText !== 'Remove from Cart') {
        allButtonsCorrect = false;
        break;
      }
    }

    await page.waitForSelector('#cart-count');
    const cartCountHandle = await page.$('#cart-count');
    const cartCountText = await cartCountHandle.getProperty('innerText');
    const cartCount = await cartCountText.jsonValue();

    expect(allButtonsCorrect).toBe(true);
    expect(cartCount).toBe('20');
  }, 100000);

  // Check to make sure that the cart in localStorage is what you expect
  it('Checking the localStorage to make sure cart is correct', async () => {
    const cartContents = await page.evaluate(() => {
      return localStorage.getItem('cart');
    });

    expect(cartContents).toBe('[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]');
  });

  // Checking to make sure that if you remove all of the items from the cart that the cart
  // number in the top right of the screen is 0
  it('Checking number of items in cart on screen after removing from cart', async () => {
    console.log('Removing all items from cart...');

    const prodItems = await page.$$('product-item');

    for(let i = 0; i < prodItems.length; i++) {
      const shadowRoot = await prodItems[i].getProperty('shadowRoot');
      const button = await shadowRoot.$('button');

      const buttonTextHandle = await button.getProperty('innerText');
      const buttonText = await buttonTextHandle.jsonValue();

      if(buttonText === 'Remove from Cart') {
        await button.click();
        await new Promise(resolve => setTimeout(resolve, 100)); // Delay to let DOM update
      }
    }

    await page.waitForSelector('#cart-count');
    const cartCountHandle = await page.$('#cart-count');
    const cartCountText = await cartCountHandle.getProperty('innerText');
    const cartCount = await cartCountText.jsonValue();

    expect(cartCount).toBe('0');
  }, 100000);

  // Checking to make sure that it remembers us removing everything from the cart
  // after we refresh the page
  it('Checking number of items in cart on screen after reload', async () => {
    console.log('Checking number of items in cart on screen after reload...');

    await page.reload({waitUntil:['networkidle0', 'domcontentloaded']});

    const prodItems = await page.$$('product-item');
    let allButtonsCorrect = true;

    for(let i = 0; i < prodItems.length; i++) {
      const shadowRoot = await prodItems[i].getProperty('shadowRoot');
      const button = await shadowRoot.$('button');
      const buttonTextHandle = await button.getProperty('innerText');
      const buttonText = await buttonTextHandle.jsonValue();

      if(buttonText !== 'Add to Cart') {
        allButtonsCorrect = false;
        break;
      }
    }

    await page.waitForSelector('#cart-count');
    const cartCountHandle = await page.$('#cart-count');
    const cartCountText = await cartCountHandle.getProperty('innerText');
    const cartCount = await cartCountText.jsonValue();

    expect(allButtonsCorrect).toBe(true);
    expect(cartCount).toBe('0');
  }, 100000);

  // Checking to make sure that localStorage for the cart is as we'd expect for the
  // cart being empty
  it('Checking the localStorage to make sure cart is correct', async () => {
    console.log('Checking the localStorage...');

    const cartContents = await page.evaluate(() => {
      return localStorage.getItem('cart');
    });

    expect(cartContents).toBe('[]');
  });
});
