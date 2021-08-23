const mongoose = require('mongoose')

const Schema = new mongoose.Schema({
  hash: {
    type: String,
    unique: true
  },
  owner: String,
  character: String,
  weapon: String,
  target: String,
  playerRoll: Number,
  enemyRoll: Number,
  xpGain: Number,
  skillGain: Number,
  blockNumber: Number,
  timestamp: Number
})
module.exports = mongoose.model('Fight', Schema)
