const chalk = require('chalk')
require('dotenv').config()

const config = require('./config')
const Safari = require('./safari')

const log = console.log

async function main() {
  const safari = new Safari({
    email: process.env.EMAIL,
    password: process.env.PASSWORD,
    bookUrl: process.argv[2] || process.env.BOOK_URL,
    ...config
  })

  try {
    await safari.start()
  } catch (err) {
    log(chalk.red(err))
    process.exit()
  }
}

main()
