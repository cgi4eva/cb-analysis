const mongoose = require('mongoose')

const Schema = new mongoose.Schema({
  charId: {
    type: Number,
    unique: true
  },
  charLevel: Number,
  charElement: String,
  ownerAddress: String,
  blockNumber: Number,
  timestamp: Number
})
module.exports = mongoose.model('Character', Schema)
