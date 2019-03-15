const chalk = require('chalk')
require('dotenv').config()

const { retry, log } = require('./helper')
const config = require('./config')
const Safari = require('./safari')

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
