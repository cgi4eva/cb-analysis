const pRetry = require('p-retry')

const web3Helper = require('../helpers/web3-helper')
const { queue } = require('../helpers/queue')
const logger = require('../helpers/logger')
const { multicall } = require('../helpers/multicall')

const { Characters, Weapons, Shields } = require('../models')

const RETRY_COUNT = 1

let processed = 0

const init = async (nft) => {
  if (!web3Helper.isNFT(nft)) {
    logger('error', 'nft', '', `${nft} not found.`)
    process.exit(0)
  }
  const nftAddress = web3Helper.getAddressByName(nft)

  const itemQueue = queue(nft)

  const getModelByNFT = (nft) => {
    switch (nft) {
      case 'character': return Characters
      case 'weapon': return Weapons
      case 'shield': return Shields
      default: return null
    }
  }

  const insertBatch = async (items, done) => {
    const idKey = web3Helper.getIdKey(nftAddress)
    const NFTModel = getModelByNFT(nft)
    if (!NFTModel || !idKey) return

    const multiData = web3Helper.getNFTCall(nftAddress, 'get', items.map((item) => item.nftId))

    const data = await pRetry(() => multicall(multiData.abi, multiData.calls), { retries: RETRY_COUNT })

    let owners = []
    if (nft === 'weapon') {
      owners = items.map(item => web3Helper.getDefaultAddress())
    } else {
      const multiOwner = web3Helper.getNFTCall(nftAddress, 'ownerOf', items.map((item) => item.nftId))

      owners = await pRetry(() => multicall(multiOwner.abi, multiOwner.calls, true), { retries: RETRY_COUNT })
    }

    try {
      const bulkResult = await NFTModel.bulkWrite(
        items.map((item, i) => {
          const block = { number: item.blockNumber, timestamp: 0 }
          return {
            updateOne: {
              filter: { [idKey]: item.nftId },
              update: { $set: web3Helper.processNFTData(nftAddress, item.nftId, owners[i], block, data[i]) },
              upsert: true
            }
          }
        })
      )
      processed += bulkResult.nUpserted + bulkResult.nModified
      logger('success', web3Helper.getTypeName(nftAddress), 'processed', processed)
      done()
    } catch (e) {
      logger('error', web3Helper.getTypeName(nftAddress), 'processor', e.message)
    }
  }

  itemQueue.process(async (job, done) => {
    if (!job.data) return done()
    logger('info', nft, 'processor', `Doing job #${job.id}`)
    return insertBatch(job.data, done)
  })
}

module.exports = init
