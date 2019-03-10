const fs = require('fs')
const chalk = require('chalk')

async function injectCookiesFromFile(file) {
  let cb = async _cookies => {
    const _user = _cookies[_cookies.length - 1].name
    await this.page.setCookie(..._cookies)
    log(chalk.cyan('Load local cookie'))
  }

  fs.readFile(file, async (err, data) => {
    if (err) {
      log(chalk.yellow('Cookie does not exist, go to login page'))
      return
    }

    let cookies = JSON.parse(data)
    await cb(cookies)
  })
}

/**
 * Write Cookies object to target JSON file
 * @param {string} targetFile
 */
async function saveCookies(targetFile) {
  let cookies = await this.page.cookies()
  log(chalk.cyan('Save cookie to local'))
  return saveToJSONFile(cookies, targetFile)
}

/**
 * Write JSON object to specified target file
 * @param {string} jsonObj
 * @param {string} targetFile
 */
async function saveToJSONFile(jsonObj, targetFile) {
  return new Promise((resolve, reject) => {
    try {
      var data = JSON.stringify(jsonObj)
      // log("Saving object '%s' to JSON file: %s", data, targetFile)
    } catch (err) {
      log('Could not convert object to JSON string ! ' + err)
      reject(err)
    }

    // Try saving the file.
    fs.writeFile(targetFile, data, (err, text) => {
      if (err) reject(err)
      else {
        resolve(targetFile)
      }
    })
  })
}

function log(...args) {
  return console.log(...args)
}

module.exports = {
  injectCookiesFromFile,
  saveCookies,
  log
}
