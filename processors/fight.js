const md5 = require('md5')

const web3Helper = require('../helpers/web3-helper')
const { queue } = require('../helpers/queue')
const logger = require('../helpers/logger')

const { Fights } = require('../models')

const init = async () => {
  const itemQueue = queue('fight')

  const insertBatch = async (items, done) => {
    if (!Fights) return

    try {
      const bulkResult = await Fights.bulkWrite(
        await Promise.all(items.map(async (item, i) => {
          const block = await web3Helper.getWeb3().eth.getBlock(item.blockNumber).catch(() => {
            return { number: item.blockNumber, timestamp: 0 }
          })
          const { number, timestamp } = block
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
        }))
      )

      logger('success', 'fight', 'processed', bulkResult.nUpserted + bulkResult.nModified)
      done()
    } catch (e) {
      logger('error', 'fight', 'processor', e.message)
    }

    setTimeout(() => {
      return init()
    }, 3000)
  }

  itemQueue.process(async (job, done) => {
    logger('info', 'fight', 'processor', `Doing job #${job.id}`)
    await insertBatch(job.data, done)
  })
}

module.exports = init
