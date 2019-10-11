const puppeteer = require('puppeteer')

console.log('crawling, craaaaawling..')

async function startBrowser() {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  return { browser, page}
}

async function findLink(page, linkString, nameField, currency) {
  const itemsLink= await page.$$(".fl a")
  const ratingSpan= await page.$$(".fl .sf")
  const priceSpan = await page.$$(".doubleright span");
  const priceSpanBIN = await page.$$(".doubleright");
  
  /* GET BIN PRICE */
  for (let i=0;i<priceSpanBIN.length ;i++) {
    const bin = await (await priceSpanBIN[i].getProperty('innerText')).jsonValue()
    
    let binPriceIndex = await bin.indexOf('BIN:')
      if (binPriceIndex == -1) {
        console.log('No BIN price')
      } else {
        binPrice = bin.slice(binPriceIndex, (binPriceIndex+10))
        console.log(binPrice)
      }
      
  }
  /* GET STARTING BID */
  for (let i=0;i<priceSpan.length ;i++) {
    const startingBid = await (await priceSpan[i].getProperty('innerText')).jsonValue()
    if (startingBid.includes(currency)) {
      console.log(startingBid)
    }
  }

  /* GET THE RATING SCORE */
  const allRatings = []
  for (let i=0;i<ratingSpan.length ;i++) {
    const itemRating = await (await ratingSpan[i].getProperty('innerText')).jsonValue();
    let intemScore = itemRating.slice(16,20)
    allRatings.push(intemScore)
    if (intemScore !== allRatings[i-1]) {
      console.log(intemScore)
    }
  }
 
  /* GET THE GAME NAME AND URL */
  for (let i=0;i<itemsLink.length ;i++) {
    const itemHref = await (await itemsLink[i].getProperty('href'))
    const linkValue = await itemHref.jsonValue()
    const linkText = await (await itemsLink[i].getProperty('innerText')).jsonValue()

    if(linkValue.includes(nameField)) {
      console.log('Name of the game: ',linkText)
      console.log('Game URL: ',linkValue)
    }
  }
  /* GET THE NAME AND NAME URL, GET THE POST URL OF THE BOARD GAME  */
  for (let i=0;i<itemsLink.length ;i++) {
    const itemHref = await (await itemsLink[i].getProperty('href'))
    const linkValue = await itemHref.jsonValue()
    
    if (linkValue.includes(linkString)) {
      console.log('Post URL: ',linkValue)
    } 
  } 
}

/* DEFINE KEYWORDS FOR THE CRAWL */
async function crawlAround(url) {
  const {browser, page} = await startBrowser()
  await page.goto(url)
  await findLink(page, 'geeklist', '/boardgame/', 'Starting bid: €')
  await browser.close()
}

/* INITIATE CRAWLING */
(async () => {
  await crawlAround("https://boardgamegeek.com/geeklist/259955/essen-2019-no-shipping-auction-list-post-your-own/page/1")
  process.exit(1)
})()



/* 
const items = await page.$$(".fl");
const ratingSpan = await page.$$(".fl .sf");
const itemsLink= await page.$$(".fl a");


for (let i = 0; i < items.length; i++) {
  const itemName = await (await itemsLink[i].getProperty('innerText')).jsonValue();
  const itemHref = await (await itemsLink[i].getProperty('href'));
  const itemRating = await (await ratingSpan[i].getProperty('innerText')).jsonValue();;
  if  (itemHref.search('geeklist'))  {
    console.log('geeklist:::::::')
  }
  console.log('itemName: ', itemName);
  console.log('itemHref: ', itemHref);
  console.log('itemRating: ', itemRating);
}



/*console.log(await page.content());*/

