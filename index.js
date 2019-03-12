const chalk = require('chalk')
require('dotenv').config()

const config = require('./config')
const Safari = require('./safari')

const log = console.log

async function main() {
  const safari = new Safari(config)

  try {
    await safari.start()
  } catch (err) {
    log(chalk.red(err))
    process.exit()
  }
}

main()
