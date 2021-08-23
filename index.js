const mongoose = require('mongoose')
const path = require('path')
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv)).argv

require('dotenv').config()

let connectionString = process.env.MONGDB_URL
if (process.env.MONGODB_SSL) connectionString += `&tls=true&tlsCAFile=${path.join(__dirname, 'cert.crt')}`
mongoose.connect(connectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true
}, (err) => {
  if (err) {
    console.log(err)
    process.exit(0)
  }

  try {
    let from = null
    let exit = false
    if (argv.start) from = argv.start
    if (argv.exit) exit = true
    if (argv.task) {
      const start = require(`./tasks/${argv.task.toString().trim()}.js`)
      if (argv.task === 'nft' && argv.type) start(argv.type, exit, from)
      else start(exit, from)
    }
    if (argv.proc) {
      const start = require(`./processors/${argv.proc.toString().trim()}.js`)
      if (argv.proc === 'nft' && argv.type) start(argv.type)
      else start()
    }
  } catch (e) {
    console.log(e)
    console.log('Module not found')
    process.exit(0)
  }
})
module.exports = mongoose
