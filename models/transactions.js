const mongoose = require('mongoose')

const Schema = new mongoose.Schema({
  hash: {
    type: String,
    unique: true
  },
  from: String,
  to: String,
  value: String,
  blockNumber: Number,
  timestamp: Number
})
module.exports = mongoose.model('Transaction', Schema)
