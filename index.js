const chalk = require('chalk')
require('dotenv').config()

const Safari = require('./safari')
const { log } = require('./utils')

async function main() {
  const safari = new Safari({
    email: process.env.EMAIL,
    password: process.env.PASSWORD,
    bookUrl: process.argv[2] || process.env.BOOK_URL,
    defaultTimeout: 60000
  })
  try {
    await safari.start()
  } catch (err) {
    log(chalk.red(err))
    process.exit()
  }
}

main()
