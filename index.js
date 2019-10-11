const fs =require('fs')
const { Parser } = require('json2csv');
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
  
  /* GET THE POST URL OF THE BOARD GAME  */
  const postUrlData = []
  for (let i=0;i<itemsLink.length ;i++) {
    const itemHref = await (await itemsLink[i].getProperty('href'))
    const linkValue = await itemHref.jsonValue()
    
    if (linkValue.includes(linkString)) {
      await postUrlData.push(linkValue)
    } 
  } 
  
  /* GET THE GAME NAME AND URL */
  const gameNameData = []
  const gameURLData = []
  
  for (let i=0;i<itemsLink.length ;i++) {
    const itemHref = await (await itemsLink[i].getProperty('href'))
    const linkValue = await itemHref.jsonValue()
    const linkText = await (await itemsLink[i].getProperty('innerText')).jsonValue()
    
    if(linkValue.includes(nameField)) {
      await gameNameData.push(linkText)
      await gameURLData.push(linkValue)
    }
  }
  
  /* GET THE RATING SCORE */
  let rawRatings = []
  const gameRatingData = []
  for (let i=0;i<ratingSpan.length ;i++) {
    const itemRating = await (await ratingSpan[i].getProperty('innerText')).jsonValue();
    let intemScore = itemRating.slice(16,20)
    rawRatings.push(intemScore)
    
    if (intemScore !== rawRatings[i-1]) {
      await gameRatingData.push(intemScore)
    }
  }  
  
  /* GET STARTING BID */
  const startingBidData = []
  
  for (let i=0;i<priceSpan.length ;i++) {
    const startingBid = await (await priceSpan[i].getProperty('innerText')).jsonValue()
    
    if (startingBid.includes(currency) || startingBid.includes(' reserve') ) {
      await startingBidData.push(startingBid)
    }
  }
  
  /* GET BIN PRICE */
  const binPriceData = []
  
  for (let i=0;i<priceSpanBIN.length ;i++) {
    const bin = await (await priceSpanBIN[i].getProperty('innerText')).jsonValue()
    let binPriceIndex = await bin.indexOf('BIN:')
    if (binPriceIndex == -1) {
      await binPriceData.push('No BIN price')
    } else {
      binPrice = bin.slice(binPriceIndex, (binPriceIndex+10))
      await binPriceData.push(binPrice)
    }
  }
  
  /* AGGREGATE DATA TO JSON */
  const dataToJson = []
  for (let i=0; i<postUrlData.length; i++) {
    dataToJson.push({
      'postURL' : postUrlData[i],
      'gameName' : gameNameData[i],
      'gameURL' : gameURLData[i],
      'gameRating' : gameRatingData[i],
      'startingBid' : startingBidData[i],
      'binPrice' : binPriceData[i]
    })
  }
  
  /* CONVERT JSON TO CSV */
  const fields = ['postURL', 'gameName', 'gameURL', 'gameRating', 'startingBid', 'binPrice']
  const json2csvParser = new Parser({ fields });
  const csv = json2csvParser.parse(dataToJson);
  
  /* WRITE CSV FILE TO DISK */
  fs.writeFile(
    './csv/boardGames.csv', csv,
    (err) => err ? console.error('data not written', err) : console.log('data written')
    )
    
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