const mongoose = require('mongoose')

const Schema = new mongoose.Schema({
  weaponId: {
    type: Number,
    unique: true
  },
  weaponStars: Number,
  weaponElement: String,
  stat1Element: String,
  stat2Element: String,
  stat3Element: String,
  stat1Value: Number,
  stat2Value: Number,
  stat3Value: Number,
  lowStarBurn: Number,
  fourStarBurn: Number,
  fiveStarBurn: Number,
  ownerAddress: String,
  blockNumber: Number,
  timestamp: Number
})
module.exports = mongoose.model('Weapon', Schema)
