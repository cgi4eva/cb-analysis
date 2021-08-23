const { queue } = require('../helpers/queue')
const logger = require('../helpers/logger')

const { Transactions } = require('../models')

const init = async () => {
  const itemQueue = queue('transaction')

  const insertBatch = async (items, done) => {
    if (!Transactions) return

    try {
      const bulkResult = await Transactions.bulkWrite(
        items.map((item, i) => {
          const { number, timestamp } = { number: item.blockNumber, timestamp: 0 }
          item.blockNumber = number
          item.timestamp = timestamp
          return {
            updateOne: {
              filter: { hash: item.hash },
              update: { $set: item },
              upsert: true
            }
          }
        })
      )

      logger('success', 'transaction', 'processed', bulkResult.nUpserted + bulkResult.nModified)
      done()
    } catch (e) {
      logger('error', 'transaction', 'processor', e.message)
    }
  }

  itemQueue.process(5, async (job, done) => {
    if (!job.data) return done()
    logger('info', 'transaction', 'processor', `Doing job #${job.id}`)
    return insertBatch(job.data, done)
  })
}

module.exports = init
