const fs = require('fs')
const puppeteer = require('puppeteer')
const chalk = require('chalk')
const merge = require('easy-pdf-merge')
const { saveCookies, injectCookiesFromFile, log } = require('./utils')

class Safari {
  constructor(options) {
    this.options = {
      ...options
    }
    this.browser = null
    this.page = null
    this.title = ''
    this.resultList = []
    this.saveCookies = saveCookies.bind(this)
    this.injectCookiesFromFile = injectCookiesFromFile.bind(this)
  }

  async _lanchBrowser(flag = true) {
    this.browser = await puppeteer.launch({ headless: flag })
    this.page = await this.browser.newPage()
    await this.page.setDefaultNavigationTimeout(this.options.defaultTimeout)
  }

  async start() {
    await this.login()
    await this.generateBook()
    await this.mergePdf()
    await this.browser.close()
  }

  async _isLogin(successUrl) {
    await this.page.goto(successUrl, { waitUntil: 'load' })

    return (await this.page.url()) === successUrl
  }

  async login() {
    const { email, password, bookUrl } = this.options
    if (!email || !password) {
      throw new Error('Please type your email and password in .env file!')
    }
    if (!bookUrl) throw new Error('Please enter book url after node index.js')

    const loginUrl = 'https://learning.oreilly.com/accounts/login/'
    const successUrl = 'https://learning.oreilly.com/home/'

    if (!this.page) await this._lanchBrowser(true)

    let { page } = this

    log(chalk.blue('Logging in...'))

    await this.injectCookiesFromFile('./cookies.json')

    const isUserLogin = await this._isLogin(successUrl)

    if (isUserLogin) {
      log(chalk.green('Already logged in'))
      await this.saveCookies('./cookies.json')
      return true
    } else {
      await page.goto(loginUrl, { waitUntil: 'domcontentloaded' })

      await page.type('#id_email', email)
      await page.type('#id_password1', password)

      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
        page.click('#login.button-primary')
      ])

      const ret = (await page.url()) === successUrl

      if (ret) {
        log(chalk.green('Login successful'))
        await this.saveCookies('./cookies.json')
      }

      return ret
    }
  }

  async mergePdf() {
    log(chalk.blue('Merge pdf'))
    merge(this.resultList, `${this.title}.pdf`, err => {
      if (err) return log(chalk.red(err))
      log(chalk.green('Successfully merged!'))
    })
  }

  async createPdf(url) {
    const filename = `${url.text}.pdf`
    const path = `pdf/${filename}`

    if (fs.existsSync(path)) {
      log(chalk.yellow(`${filename} already exists`))
      this.resultList.push(path)
      return
    }

    await this.page.goto(url.href, { waitUntil: 'networkidle0' })
    await this.page.addStyleTag({
      url:
        'https://fonts.googleapis.com/css?family=Montserrat:300,400" rel="stylesheet'
    })
    await this.page.addStyleTag({ path: './style.css' })

    const wh = await this.page.evaluate(() => {
      const title = document.querySelector('.header-title')
      if (title)
        title.style.cssText =
          'margin-top: 0px !important;font-weight: 100;font-size: 36px;padding-bottom: 20px;border-bottom: 1px solid #eee;margin-bottom: 20px !important;'
      return {
        width: 900,
        height: document.body.clientHeight
      }
    })

    await this.page.setViewport(wh)
    await this.page.waitFor(5000)

    await this.page.emulateMedia('screen')
    await this.page.pdf({
      path,
      format: 'A4',
      margin: {
        top: 50,
        left: 50,
        right: 50,
        bottom: 50
      }
    })
    this.resultList.push(path)
  }

  async generateBook() {
    await this.page.goto(this.options.bookUrl)

    this.title = await this.page.evaluate(() => document.title)
    let urls = await this.page.evaluate(() => {
      const links = [...document.querySelectorAll('.t-chapter')]
      return links.map(a => {
        return {
          href: a.href.trim(),
          text: a.innerText.trim()
        }
      })
    })

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i]
      const currProgress = (((i + 1) / urls.length) * 100).toFixed(2)
      log(chalk.cyan(`${currProgress}% ${url.text}`))
      await this.createPdf(url)
    }
  }
}

module.exports = Safari
