const chalk = require('chalk')
const { retry } = require('./helper')
require('dotenv').config()

const config = require('./config')
const Safari = require('./safari')
const { log } = require('./helper')

async function main() {
  const safari = new Safari(config)

  try {
    await retry(() => safari.start(), config.maxRetryCount)
  } catch (err) {
    log.error(err)
    process.exit()
  }
}

main()
