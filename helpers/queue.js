const Queue = require('bull')

const redis = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASS || ''
}
const queue = (name) => {
  return new Queue(name, { redis })
}
module.exports = {
  queue
}
