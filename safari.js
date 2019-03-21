const fs = require('fs')
const puppeteer = require('puppeteer-core')
const chalk = require('chalk')
const Queue = require('queue')
const merge = require('easy-pdf-merge')
const _ = require('ramda')

const { log } = require('./helper')

class Safari {
  constructor(options) {
    this.options = options
    this.browser = null
    this.page = null
    this.urlList = []
    this.resultList = []
  }

  async _lanchBrowser() {
    this.browser = await puppeteer.launch({ ...this.options.launchOptions })
    this.page = await this.browser.newPage()
    await this.page.setDefaultNavigationTimeout(this.options.defaultTimeout)
  }

  async start() {
    await this.checkStatus()
    await this.generateBook()
    await this.mergePdf()
    await this.exit()
  }

  async exit() {
    if (!this.browser) return
    await this.browser.close()
  }

  async checkStatus() {
    const { email, password, bookUrl } = this.options

    if (!email || !password)
      throw new Error('Please type your email and password in .env file!')
    if (!bookUrl) throw new Error('Please enter book url after node index.js')
    if (!this.page) await this._lanchBrowser()

    await this.page.goto(bookUrl, { waitUntil: 'networkidle0' })

    // 无 cookie, 前往登陆
    const trialOverlay = await this.page.$('#trial-overlay')
    if (trialOverlay) {
      await this.login(email, password)
    }

    // 体验到期, 删除 cookie, 退出程序
    const expiredOverlay = await this.page.$('.expired')
    if (expiredOverlay) {
      log.error('Your trial was expired!')
      const cookies = await this.page.cookies()
      await this.page.deleteCookie(...cookies)
      process.exit()
    }
  }

  async login(email, password) {
    const { page } = this
    const homePage = 'https://learning.oreilly.com/home/'

    log.info('Logging in...')

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
      page.click('.t-sign-in')
    ])

    if ((await this.page.url()).includes(homePage)) {
      await this.checkStatus()
      return
    }

    await page.type('#id_email', email)
    await page.type('#id_password1', password)
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
      page.click('#login.button-primary')
    ])
  }

  async generateBook() {
    // 获取书本名称
    this.title = await this.page.evaluate(() => document.title)
    // 获取所有链接
    const links = await this.page.evaluate(() => {
      let id = 0
      const links = [...document.querySelectorAll('.t-chapter')]
      return links.map(link => ({
        href: link.origin + link.pathname,
        text: link.innerText.trim().replace(/[\/|\$]/, ' ')
      }))
    })

    this.urlList = _.uniqBy(link => link.href, links)

    const queue = new Queue({ concurrency: this.options.concurrency })
    for (let i = 0; i < this.urlList.length; i++) {
      const urlItem = this.urlList[i]
      queue.push(() => this.createPdf(urlItem, i))
    }

    return new Promise((resolve, reject) => {
      queue.start(err => {
        if (err) return reject(err)
        log.success('Download done!')
        this.resultList = this.resultList
          .sort((a, b) => a.idx - b.idx)
          .map(item => item.path)
        resolve()
      })
    })
  }

  // 生成 PDF
  async createPdf(urlItem, i) {
    const {
      browser,
      options: { pdfOptions }
    } = this
    const filename = `${i}_${urlItem.text}.pdf`
    const path = `data/tmp/${filename}`

    if (fs.existsSync(path)) {
      log.warn(`${filename} already exists`)
      this.resultList.push({ path, idx: i })
      this.printProgress(urlItem)
      return
    }

    const page = await browser.newPage()
    await page.setDefaultNavigationTimeout(this.options.defaultTimeout)
    await page.goto(urlItem.href, { waitUntil: 'networkidle0' })
    // 加入自定义样式
    await page.addStyleTag({
      url:
        'https://fonts.googleapis.com/css?family=Montserrat:300,400" rel="stylesheet'
    })
    await page.addStyleTag({ path: './style.css' })

    const wh = await page.evaluate(() => {
      const title = document.querySelector('.header-title')
      if (title)
        title.style.cssText =
          'margin-top: 0px !important;font-weight: 100;font-size: 36px;padding-bottom: 20px;border-bottom: 1px solid #eee;margin-bottom: 20px !important;'
      return {
        width: 900,
        height: document.body.clientHeight
      }
    })

    await page.setViewport(wh)

    await page.emulateMedia('screen')
    await page.pdf({
      path,
      ...pdfOptions
    })
    this.resultList.push({ path, idx: i })
    this.printProgress(urlItem)
    await page.close()
  }

  /**
   * 合并 PDF
   */
  async mergePdf() {
    log.info('Merge pdf')
    merge(
      this.resultList,
      `data/book/${this.title}-${Date.now()}.pdf`,
      { maxHeap: this.options.maxHeap },
      err => {
        if (err) throw new Error(err)
        log.success('Successfully merged!')
      }
    )
  }

  /**
   * 打印当前进度
   * @param {object} urlItem
   */
  printProgress(urlItem) {
    return log.info(
      `${((this.resultList.length / this.urlList.length) * 100).toFixed(2)}% ${
        urlItem.text
      }`
    )
  }
}

module.exports = Safari
