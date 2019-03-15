const util = require('util')
const chalk = require('chalk')

const delay = util.promisify(setTimeout)

const log = {
  info: (...args) => console.log(chalk.blue(...args)),
  success: (...args) => console.log(chalk.green(...args)),
  warn: (...args) => console.log(chalk.yellow(...args)),
  error: (...args) => console.log(chalk.red(...args))
}

/**
 * https://github.com/GoogleChrome/puppeteer/issues/2460#issuecomment-417634715
 * @param {Function} fn
 * @param {Number} maxRetryCount
 * @param {Number} retryDelay
 */
const retry = async (fn, maxRetryCount = 3, retryDelay = 100) => {
  for (let i = 0; i < maxRetryCount; i++) {
    try {
      log.warn(`Retrying ${i + 1}`)
      return await fn()
    } catch (e) {
      if (i === maxRetryCount - 1) throw e
      await delay(retryDelay)
      retryDelay = retryDelay * 2
    }
  }
}

module.exports = {
  retry,
  log
}
