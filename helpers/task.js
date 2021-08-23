const getEndBlock = (start, size, mult) => {
  return start + (size * mult)
}

const bQueueToBlocks = (bQueue, STARTING_BLOCK, END_BLOCK, BLOCKS_PER_CALL, MAX_BLOCK_MULT) => {
  if (bQueue.currentBlock > bQueue.startingBlock && bQueue.currentBlock < bQueue.endBlock) {
    STARTING_BLOCK = parseInt(bQueue.currentBlock)
    END_BLOCK = parseInt(bQueue.endBlock)
  } else if (bQueue.currentBlock >= bQueue.endBlock) {
    STARTING_BLOCK = parseInt(bQueue.startingBlock + (BLOCKS_PER_CALL * MAX_BLOCK_MULT))
    END_BLOCK = getEndBlock(STARTING_BLOCK, BLOCKS_PER_CALL, MAX_BLOCK_MULT)
  } else {
    STARTING_BLOCK = parseInt(bQueue.startingBlock)
    END_BLOCK = getEndBlock(STARTING_BLOCK, BLOCKS_PER_CALL, MAX_BLOCK_MULT)
  }
}

module.exports = {
  getEndBlock,
  bQueueToBlocks
}
