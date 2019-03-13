module.exports = {
  email: process.env.EMAIL,
  password: process.env.PASSWORD,
  bookUrl: process.argv[2] || process.env.BOOK_URL,
  concurrency: process.env.CONCURRENCY,
  defaultTimeout: process.env.DEFAULT_TIMEOUT,
  maxHeap: process.env.MAX_HEAP,
  launchOptions: {
    args: process.env.DOCKER
      ? ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      : [],
    headless: true,
    userDataDir: process.env.USER_DATA_DIR,
    executablePath: process.env.EXECUTABLE_PATH
  },
  pdfOptions: {
    format: 'A4',
    margin: {
      top: 50,
      left: 50,
      right: 50,
      bottom: 50
    },
    displayHeaderFooter: true,
    headerTemplate: `<p class="title" style="font-size: 12px;color: #3c3c3b;margin: 0 auto;"></p>`,
    footerTemplate: `<p></p>`
  }
}
