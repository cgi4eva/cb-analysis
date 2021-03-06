const PQueue = require('p-queue')
const pRetry = require('p-retry')

const web3Helper = require('../helpers/web3-helper')
const { queue } = require('../helpers/queue')
const logger = require('../helpers/logger')
const { getEndBlock, bQueueToBlocks } = require('../helpers/task')

const { BlockQueue } = require('../models')

const BLOCKS_PER_CALL = 300
const DATAS_PER_BATCH = 500
const RETRY_ATTEMPTS = 5
const MAX_BLOCK_MULT = 10

let STARTING_BLOCK = 9000437
let CURRENT_BLOCK = STARTING_BLOCK
let END_BLOCK = getEndBlock(STARTING_BLOCK, BLOCKS_PER_CALL, MAX_BLOCK_MULT)

const mainQueue = new PQueue({ concurrency: 30 })

let toProcess = []

const init = async (exit, start) => {
  const itemQueue = queue('fight')
  const bQueue = await BlockQueue.findOne({ type: 'fight' })
  if (bQueue) {
    bQueueToBlocks(bQueue)
  }

  if (start) {
    STARTING_BLOCK = start
    END_BLOCK = getEndBlock(STARTING_BLOCK, BLOCKS_PER_CALL, MAX_BLOCK_MULT)
  }

  CURRENT_BLOCK = STARTING_BLOCK

  const runQueue = (fromBlock) => async () => {
    const { onContract } = web3Helper.web3LoadBalancer()
    await onContract('cryptoblades', async (contract) => {
      const results = await pRetry(() => contract.getPastEvents('FightOutcome', {
        fromBlock,
        toBlock: fromBlock + BLOCKS_PER_CALL
      }),
      { retries: RETRY_ATTEMPTS })

      logger('info', 'fight', 'retrieve', `${fromBlock} ${results.length} ${BLOCKS_PER_CALL}`)

      results.forEach(result => {
        toProcess.push({
          owner: result.returnValues[0],
          character: result.returnValues[1],
          weapon: result.returnValues[2],
          target: result.returnValues[3],
          playerRoll: result.returnValues[4],
          enemyRoll: result.returnValues[5],
          xpGain: result.returnValues[6],
          skillGain: result.returnValues[7],
          blockNumber: result.blockNumber
        })
        checkToProcess(DATAS_PER_BATCH)
      })

      CURRENT_BLOCK += BLOCKS_PER_CALL

      await BlockQueue.findOneAndUpdate({ type: 'fight' }, {
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
      if (items.length > 0) {
        toProcess = []
        logger('warn', 'fight', 'queue', `${items.length} items on queue.`)
        itemQueue.add(items)
      }
    }
  }

  const max = Math.floor((END_BLOCK - STARTING_BLOCK) / BLOCKS_PER_CALL)
  mainQueue.add(runQueue(STARTING_BLOCK), { priority: max })
  for (let i = 1; i < max; i += 1) {
    mainQueue.add(runQueue(STARTING_BLOCK + (BLOCKS_PER_CALL * i)), { priority: max - i })
  }

  await mainQueue.onIdle()

  STARTING_BLOCK += (BLOCKS_PER_CALL * max)
  CURRENT_BLOCK = STARTING_BLOCK
  END_BLOCK = getEndBlock(STARTING_BLOCK, BLOCKS_PER_CALL, MAX_BLOCK_MULT)

  await BlockQueue.findOneAndUpdate({ type: 'fight' }, {
    startingBlock: STARTING_BLOCK,
    currentBlock: CURRENT_BLOCK,
    endBlock: END_BLOCK
  }, {
    new: true,
    upsert: true
  })

  await checkToProcess(0)

  if (exit) process.exit(0)
  setTimeout(() => {
    init(false, STARTING_BLOCK)
  }, 3000)
}

module.exports = init
