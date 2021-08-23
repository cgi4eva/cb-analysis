const pRetry = require('p-retry')

const web3Helper = require('../helpers/web3-helper')
const { queue } = require('../helpers/queue')
const logger = require('../helpers/logger')

const { Characters, Weapons, Shields } = require('../models')

const RETRY_ATTEMPTS = 5

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

    const { runContract } = web3Helper.web3LoadBalancer()

    const data = await Promise.all(items.map(async (item, i) => {
      return runContract(
        nft,
        'get',
        [item.nftId]
      ).then(val => val)
    }))

    console.log(data.length)

    const bulk = NFTModel.collection.initializeUnorderedBulkOp()

    items.forEach(async (item, i) => {
      const block = await web3Helper.getWeb3().eth.getBlock(item.blockNumber).catch(() => {
        return { number: item.blockNumber, timestamp: 0 }
      })
      let ownerAddress = web3Helper.getDefaultAddress()
      ownerAddress = await web3Helper.getNFTOwner(nftAddress, item.nftId).catch(() => {
        return web3Helper.getDefaultAddress()
      })
      bulk
        .find({ [idKey]: item.nftId })
        .upsert()
        .replaceOne(
          web3Helper.processNFTData(nftAddress, item.nftId, ownerAddress, block, data[i])
        )
    })

    try {
      const bulkResult = await pRetry(() => bulk.execute(), { retries: RETRY_ATTEMPTS })

      logger('success', web3Helper.getTypeName(nftAddress), 'processed', bulkResult.nUpserted + bulkResult.nModified)
      done()
    } catch (e) {
      logger('error', web3Helper.getTypeName(nftAddress), 'processor', e.message)
    }
  }

  itemQueue.process(async (job, done) => {
    logger('info', nft, 'processor', `Doing job #${job.id}`)
    insertBatch(job.data, done)
  })
}

module.exports = init
