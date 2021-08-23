const mongoose = require('mongoose')

const Schema = new mongoose.Schema({
  shieldId: {
    type: Number,
    unique: true
  },
  shieldStars: Number,
  shieldElement: String,
  stat1Element: String,
  stat2Element: String,
  stat3Element: String,
  stat1Value: Number,
  stat2Value: Number,
  stat3Value: Number,
  ownerAddress: String,
  blockNumber: Number,
  timestamp: Number
})
module.exports = mongoose.model('Shield', Schema)
