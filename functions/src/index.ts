import * as puppeteer from 'puppeteer'
import * as functions from 'firebase-functions'
// import * as admin from 'firebase-admin'

// admin.initializeApp(functions.config().firebase)
// const db = admin.firestore();

const openConnection = async () => {
  const { default: config } = await import('./puppeteer.config')
  const browser = await puppeteer.launch(config)
  const page = await browser.newPage()
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36'
  )
  await page.setViewport({ width: 1024, height: 720 })
  await page.setRequestInterception(true);
  page.on('request', request => {
    if (['image', 'media'].includes(request.resourceType()))
      request.abort();
    else
      request.continue();
  });
  return { browser, page }
};

const closeConnection = async (browser: puppeteer.Browser, page: puppeteer.Page) => {
  page && (await page.close())
  browser && (await browser.close())
};

export const helloWorld = functions
  .runWith({ timeoutSeconds: 300, memory: '2GB' })
  .https
  .onRequest(async (req, res) => {
    const { browser, page } = await openConnection()
    // await page.setCookie({
    //   name: 'uni25',
    //   value: '586%2F%25%2FPussyWagon%2F%25%2F2401ebba4e73f47bad941f66f2772205%2F%25%2F0%2F%25%2F588%2C67%2F%25%2F0%2F%25%2F%2F%25%2F%2F%25%2F%2F%25%2F0%2F%25%2F%2F%25%2F0%2F%25%2F1%2F%25%2F0%2F%25%2F0',
    //   domain: 'xgame-online.com',
    //   path: '/',
    //   expires: -1,
    // })
    try {
      await page.goto('https://xgame-online.com/uni25/index.php')
      console.log(page.url())

      if (page.url() === 'https://xgame-online.com/index.php') {
        const form: puppeteer.ElementHandle<HTMLFormElement> | null = await page.$('form[name=formular]')
        if (form) {
          const username = await form.$x('//table/tbody/tr[1]/td[2]/input')
          const password = await form.$x('//table/tbody/tr[2]/td[2]/input')
          await (username.length && username[0].type(process.env.USERNAME || '', { delay: 100 }))
          await (password.length && password[0].type(process.env.PASSWORD || '', { delay: 100 }))
          await form.evaluate(form => form.submit())
        }

        await page.waitForNavigation()

        // TODO record cookies to firebase
      }

      console.log(await page.cookies())

      res.status(200).send('OK')
    } catch (err) {
      res.status(500).send(err.message)
    } finally {
      await closeConnection(browser, page)
    }
  });