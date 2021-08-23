const PQueue = require('p-queue')
const pRetry = require('p-retry')

const web3Helper = require('../helpers/web3-helper')
const { queue } = require('../helpers/queue')
const logger = require('../helpers/logger')
const { getEndBlock, bQueueToBlocks } = require('../helpers/task')

const { BlockQueue } = require('../models')

const BLOCKS_PER_CALL = 2000
const DATAS_PER_BATCH = 300
const RETRY_ATTEMPTS = 5
const MAX_BLOCK_MULT = 10

let STARTING_BLOCK = 9000437
let CURRENT_BLOCK = STARTING_BLOCK
let END_BLOCK = getEndBlock(STARTING_BLOCK, BLOCKS_PER_CALL, MAX_BLOCK_MULT)

const mainQueue = new PQueue({ concurrency: 30 })

let toProcess = []

const init = async (nft, exit, start) => {
  if (!web3Helper.isNFT(nft)) {
    logger('error', 'nft', '', `${nft} not found.`)
    process.exit(0)
  }
  const nftAddress = web3Helper.getAddressByName(nft)
  const itemQueue = queue(nft)
  const bQueue = await BlockQueue.findOne({ type: web3Helper.getTypeName(nftAddress) })
  if (bQueue) {
    bQueueToBlocks(bQueue)
  }

  if (start) {
    STARTING_BLOCK = start
    END_BLOCK = getEndBlock(STARTING_BLOCK, BLOCKS_PER_CALL, MAX_BLOCK_MULT)
  }

  const runQueue = (fromBlock) => async () => {
    const { onContract } = web3Helper.web3LoadBalancer()
    await onContract(web3Helper.getTypeName(nftAddress), async (contract) => {
      const results = await pRetry(() => contract.getPastEvents(web3Helper.getEvent(nftAddress), {
        fromBlock,
        toBlock: fromBlock + BLOCKS_PER_CALL
      }),
      { retries: RETRY_ATTEMPTS })
      logger('info', web3Helper.getTypeName(nftAddress), 'retrieve', `${fromBlock} ${results.length} ${BLOCKS_PER_CALL}`)

      results.forEach(result => {
        toProcess.push({
          nftId: result.returnValues[0],
          minter: result.returnValues[1],
          blockNumber: result.blockNumber
        })
        checkToProcess(DATAS_PER_BATCH)
      })

      CURRENT_BLOCK += BLOCKS_PER_CALL

      await BlockQueue.findOneAndUpdate({ type: web3Helper.getTypeName(nftAddress) }, {
        startingBlock: STARTING_BLOCK,
        currentBlock: CURRENT_BLOCK,
        endBlock: END_BLOCK
      }, {
        new: true,
        upsert: true
      })
    })
  }

  const checkToProcess = async (maxLength) => {
    if (toProcess.length >= maxLength) {
      const items = [...toProcess]
      toProcess = []
      logger('warn', web3Helper.getTypeName(nftAddress), 'queue', `${items.length} items on queue.`)
      itemQueue.add(items, { attempts: RETRY_ATTEMPTS })
    }
  }

  const max = Math.floor((END_BLOCK - STARTING_BLOCK) / BLOCKS_PER_CALL)
  mainQueue.add(runQueue(STARTING_BLOCK), { priority: max })
  for (let i = 1; i < max; i += 1) {
    mainQueue.add(runQueue(STARTING_BLOCK + (BLOCKS_PER_CALL * i)), { priority: max - i })
  }

  await mainQueue.onIdle()

  await checkToProcess(0)

  if (exit) process.exit(0)
  setTimeout(() => {
    init(nft, false)
  }, 3000)
}

module.exports = init
