const pRetry = require('p-retry')
const md5 = require('md5')

const web3Helper = require('../helpers/web3-helper')
const { queue } = require('../helpers/queue')
const logger = require('../helpers/logger')

const { Fights } = require('../models')

const RETRY_ATTEMPTS = 5

const init = async () => {
  const itemQueue = queue('fight')

  const insertBatch = async (items, done) => {
    if (!Fights) return

    const bulk = Fights.collection.initializeUnorderedBulkOp()

    items.forEach(async (fight) => {
      const block = await web3Helper.getWeb3().eth.getBlock(fight.blockNumber).catch(() => {
        return { number: fight.blockNumber, timestamp: 0 }
      })
      const { number, timestamp } = block
      const hash = md5(JSON.stringify(items))
      fight.hash = hash
      fight.blockNumber = number
      fight.timestamp = timestamp
      bulk
        .find({ hash })
        .upsert()
        .replaceOne(fight)
    })

    try {
      const bulkResult = await pRetry(() => bulk.execute(), { retries: RETRY_ATTEMPTS })

      logger('success', 'fight', 'processed', bulkResult.nUpserted + bulkResult.nModified)
      done()
    } catch (e) {
      logger('error', 'fight', 'processor', e.message)
    }
  }

  itemQueue.process(async (job, done) => {
    logger('info', 'fight', 'processor', `Doing job #${job.id}`)
    await insertBatch(job.data, done)
  })
}

module.exports = init
