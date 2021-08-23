const md5 = require('md5')

const { queue } = require('../helpers/queue')
const logger = require('../helpers/logger')

const { Fights } = require('../models')

const init = async () => {
  const itemQueue = queue('fight')

  const insertBatch = async (items, done) => {
    if (!Fights) return

    try {
      const bulkResult = await Fights.bulkWrite(
        items.map((item, i) => {
          const { number, timestamp } = { number: item.blockNumber, timestamp: 0 }
          const hash = md5(JSON.stringify(items))
          item.hash = hash
          item.blockNumber = number
          item.timestamp = timestamp
          return {
            updateOne: {
              filter: { hash },
              update: { $set: item },
              upsert: true
            }
          }
        })
      )

      logger('success', 'fight', 'processed', bulkResult.nUpserted + bulkResult.nModified)
      done()
    } catch (e) {
      logger('error', 'fight', 'processor', e.message)
    }
  }

  itemQueue.process(5, async (job, done) => {
    if (!job.data) return done()
    logger('info', 'fight', 'processor', `Doing job #${job.id}`)
    return insertBatch(job.data, done)
  })
}

module.exports = init
