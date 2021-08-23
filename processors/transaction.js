const web3Helper = require('../helpers/web3-helper')
const { queue } = require('../helpers/queue')
const logger = require('../helpers/logger')

const { Transactions } = require('../models')

const init = async () => {
  const itemQueue = queue('transaction')

  const insertBatch = async (items, done) => {
    if (!Transactions) return

    try {
      const bulkResult = await Transactions.bulkWrite(
        await Promise.all(items.map(async (item, i) => {
          const block = await web3Helper.getWeb3().eth.getBlock(item.blockNumber).catch(() => {
            return { number: item.blockNumber, timestamp: 0 }
          })
          const { number, timestamp } = block
          item.blockNumber = number
          item.timestamp = timestamp
          return {
            updateOne: {
              filter: { hash: item.hash },
              update: { $set: item },
              upsert: true
            }
          }
        }))
      )

      logger('success', 'transaction', 'processed', bulkResult.nUpserted + bulkResult.nModified)
      done()
    } catch (e) {
      logger('error', 'transaction', 'processor', e.message)
    }
  }

  itemQueue.process(async (job, done) => {
    logger('info', 'transaction', 'processor', `Doing job #${job.id}`)
    await insertBatch(job.data, done)
  })
}

module.exports = init
