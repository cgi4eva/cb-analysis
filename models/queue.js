const mongoose = require('mongoose')

const Schema = new mongoose.Schema({
  type: {
    type: String,
    unique: true
  },
  startingBlock: Number,
  currentBlock: Number,
  endBlock: Number
})
module.exports = mongoose.model('Queue', Schema)
