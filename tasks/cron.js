const { queue } = require('../helpers/queue')
const logger = require('../helpers/logger')

const list = [
  'fight',
  'character',
  'weapon',
  'shield',
  'transaction'
]

let cleanerIndex = 0
let retryIndex = 0

async function clearCompleted () {
  let name = list[cleanerIndex]
  const itemQueue = queue(name)
  if (name.includes('items')) name = name.split('-')[1]
  logger('info', 'cron', name, 'Cleaner is now running')
  const count = await itemQueue.getJobCounts()
  if (count.completed > 0) {
    await itemQueue.clean(5000)
    logger('main', 'cron', name, `Cleaned ${count.completed} completed tasks.`)
  }
  cleanerIndex++
  if (cleanerIndex >= list.length) return process.exit(0)
  setTimeout(async () => {
    clearCompleted()
  }, 10000)
}

async function retryFailed () {
  let name = list[retryIndex]
  const itemQueue = queue(name)
  if (name.includes('items')) name = name.split('-')[1]
  logger('info', 'cron', name, 'Requeuer is now running')
  const jobs = await itemQueue.getJobs(['failed'])
  const res = await Promise.all(jobs.map(async job => {
    await job.retry()
    return job
  }))
  if (res.length > 0) { logger('warn', 'cron', name, `${res.length} jobs successfully requeued.`) }
  retryIndex++
  if (retryIndex >= list.length) return process.exit(0)
  setTimeout(async () => {
    retryFailed()
  }, 10000)
}

module.exports = () => {
  clearCompleted()
  retryFailed()
}
