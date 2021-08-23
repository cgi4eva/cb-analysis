const Web3 = require('web3')
const _ = require('lodash')

const {
  createWeb3ContractsServices,
  createLoadBalancedContractsService
} = require('web3-load-balance')

const helpers = {
  getWeb3: () => {
    return new Web3(process.env.HTTP_PROVIDER_URL || 'https://bsc-dataseed.binance.org/')
  },
  getNodes: () =>
    [
      'https://bsc-dataseed.binance.org/',
      'https://bsc-dataseed1.defibit.io/',
      'https://bsc-dataseed1.ninicoin.io/',
      'https://bsc-dataseed2.defibit.io/',
      'https://bsc-dataseed3.defibit.io/',
      'https://bsc-dataseed4.defibit.io/',
      'https://bsc-dataseed2.ninicoin.io/',
      'https://bsc-dataseed3.ninicoin.io/',
      'https://bsc-dataseed4.ninicoin.io/',
      'https://bsc-dataseed1.binance.org/',
      'https://bsc-dataseed2.binance.org/',
      'https://bsc-dataseed3.binance.org/',
      'https://bsc-dataseed4.binance.org/'
    ],
  getDefaultAddress: () => process.env.ADDRESS_DEFAULT || '0x0000000000000000000000000000000000000000',
  getCryptoBladesAddress: () => process.env.ADDRESS_CRYPTOBLADES || '0x39Bea96e13453Ed52A734B6ACEeD4c41F57B2271',
  getStakingAddress: () => process.env.ADDRESS_STAKING || '0xd6b2D8f59Bf30cfE7009fB4fC00a7b13Ca836A2c',
  getTokenAddress: () => process.env.ADDRESS_TOKEN || '0x154a9f9cbd3449ad22fdae23044319d6ef2a1fab',
  getMarketplaceAddress: () => process.env.ADDRESS_MARKET || '0x90099dA42806b21128A094C713347C7885aF79e2',
  getCharactersAddress: () => process.env.ADDRESS_CHARACTER || '0xc6f252c2CdD4087e30608A35c022ce490B58179b',
  getWeaponsAddress: () => process.env.ADDRESS_WEAPON || '0x7E091b0a220356B157131c831258A9C98aC8031A',
  getShieldsAddress: () => process.env.ADDRESS_SHIELD || '0xf9E9F6019631bBE7db1B71Ec4262778eb6C3c520',
  getMultiCallAddress: () => process.env.ADDRESS_MULTICALL || '0x1ee38d535d541c55c9dae27b12edf090c608e6fb',

  cryptoBladesAbiPath: '../contracts/CryptoBlades.json',
  stakingAbiPath: '../contracts/IStakingRewards.json',
  tokenAbiPath: '../contracts/IERC20.json',
  marketplaceAbiPath: '../contracts/NFTMarket.json',
  charactersAbiPath: '../contracts/Characters.json',
  weaponsAbiPath: '../contracts/Weapons.json',
  shieldsAbiPath: '../contracts/Shields.json',
  multicallAbiPath: '../contracts/MultiCall.json',

  getAbiFromAddress: (nftAddress) => {
    if (helpers.isCharacter(nftAddress)) {
      return require(helpers.charactersAbiPath)
    }

    if (helpers.isWeapon(nftAddress)) {
      return require(helpers.weaponsAbiPath)
    }

    if (helpers.isShield(nftAddress)) {
      return require(helpers.shieldsAbiPath)
    }

    return []
  },

  cryptoBlades: null,
  staking: null,
  token: null,
  market: null,
  weapons: null,
  characters: null,
  shields: null,

  web3LoadBalancer: () => {
    const contractsServices = createWeb3ContractsServices(helpers.getNodes(),
      {
        cryptoblades: {
          abi: require(helpers.cryptoBladesAbiPath),
          address: helpers.getCryptoBladesAddress()
        },
        staking: {
          abi: require(helpers.stakingAbiPath),
          address: helpers.getStakingAddress()
        },
        token: {
          abi: require(helpers.tokenAbiPath),
          address: helpers.getTokenAddress()
        },
        market: {
          abi: require(helpers.marketplaceAbiPath),
          address: helpers.getMarketplaceAddress()
        },
        character: {
          abi: require(helpers.charactersAbiPath),
          address: helpers.getCharactersAddress()
        },
        weapon: {
          abi: require(helpers.weaponsAbiPath),
          address: helpers.getWeaponsAddress()
        },
        shield: {
          abi: require(helpers.shieldsAbiPath),
          address: helpers.getShieldsAddress()
        },
        multicall: {
          abi: require(helpers.multicallAbiPath),
          address: helpers.getMultiCallAddress()
        }
      }
    )

    return createLoadBalancedContractsService(contractsServices)
  },

  getWeb3Service: () => helpers.web3LoadBalancer().runWeb3(async (web3) => web3.eth),

  getNFTCall: (nftAddress, name, nftIds) => ({
    abi: helpers.getAbiFromAddress(nftAddress),
    calls: nftIds.map((nftId) => ({
      address: nftAddress,
      name,
      params: [nftId]
    }))
  }),

  getNFTData: async (nftAddress, nftId, rawPrice, sellerAddress) => {
    let data

    if (helpers.isCharacter(nftAddress)) {
      data = await helpers.getCharacters().get(nftId)
    }

    if (helpers.isWeapon(nftAddress)) {
      data = await helpers.getWeapons().get(nftId)
    }

    if (helpers.isShield(nftAddress)) {
      data = await helpers.getShields().get(nftId)
    }

    return helpers.processNFTData(nftAddress, nftId, rawPrice, sellerAddress, data)
  },

  getBlock: async (number = 'latest') => {
    return helpers.getWeb3().eth.getBlock(number)
  },

  getLatestBlock: async () => {
    return helpers.getBlock()
  },

  WeaponElement: {
    Fire: 0,
    Earth: 1,
    Lightning: 2,
    Water: 3
  },

  WeaponTrait: {
    STR: 0,
    DEX: 1,
    CHA: 2,
    INT: 3,
    PWR: 4
  },

  traitNumberToName: (traitNum) => {
    switch (traitNum) {
      case helpers.WeaponElement.Fire: return 'Fire'
      case helpers.WeaponElement.Earth: return 'Earth'
      case helpers.WeaponElement.Lightning: return 'Lightning'
      case helpers.WeaponElement.Water: return 'Water'
      default: return ''
    }
  },

  statNumberToName: (statNum) => {
    switch (statNum) {
      case helpers.WeaponTrait.CHA: return 'CHA'
      case helpers.WeaponTrait.DEX: return 'DEX'
      case helpers.WeaponTrait.INT: return 'INT'
      case helpers.WeaponTrait.PWR: return 'PWR'
      case helpers.WeaponTrait.STR: return 'STR'
      default: return '???'
    }
  },

  getStatPatternFromProperties: (properties) => (properties >> 5) & 0x7f,
  getElementFromProperties: (properties) => (properties >> 3) & 0x3,
  getStarsFromProperties: (properties) => (properties) & 0x7,
  getStat1Trait: (statPattern) => (statPattern % 5),
  getStat2Trait: (statPattern) => (Math.floor(statPattern / 5) % 5),
  getStat3Trait: (statPattern) => (Math.floor(Math.floor(statPattern / 5) / 5) % 5),

  getFinalPrice: (nftAddress, nftId) => helpers.getContractByAddress(nftAddress).methods.getFinalPrice(nftAddress, nftId).call(),

  getNFTOwner: async (nftAddress, nftId) => helpers.getContractByAddress(nftAddress).methods.ownerOf(nftId).call(),

  isCryptoBlades: (address) => address === helpers.getCryptoBladesAddress(),
  isStaking: (address) => address === helpers.getStakingAddress(),
  isToken: (address) => address === helpers.getTokenAddress(),
  isCharacter: (nftAddress) => nftAddress === helpers.getCharactersAddress(),
  isWeapon: (nftAddress) => nftAddress === helpers.getWeaponsAddress(),
  isShield: (nftAddress) => nftAddress === helpers.getShieldsAddress(),

  processNFTData: (nftAddress, nftId, ownerAddress, block, data) => {
    const { number, timestamp } = block
    if (helpers.isCharacter(nftAddress)) {
      const character = data
      const charLevel = parseInt(character[1], 10)
      const charElement = helpers.traitNumberToName(+character[2])

      const ret = {
        charId: nftId,
        charLevel,
        charElement,
        ownerAddress,
        blockNumber: number,
        timestamp
      }

      return ret
    }

    if (helpers.isWeapon(nftAddress)) {
      const weapon = data
      const properties = weapon._properties

      const weaponElement = helpers.getElementFromProperties(properties)
      const weaponStars = helpers.getStarsFromProperties(properties)

      const statPattern = helpers.getStatPatternFromProperties(properties)
      const stat1Element = helpers.statNumberToName(helpers.getStat1Trait(statPattern))
      const stat2Element = helpers.statNumberToName(helpers.getStat2Trait(statPattern))
      const stat3Element = helpers.statNumberToName(helpers.getStat3Trait(statPattern))

      const stat1Value = weapon._stat1
      const stat2Value = weapon._stat2
      const stat3Value = weapon._stat3
      const burnPoints = weapon._burnPoints

      const lowStarBurnPoints = burnPoints & 0xff
      const fourStarBurnPoints = (burnPoints >> 8) & 0xff
      const fiveStarBurnPoints = (burnPoints >> 16) & 0xff

      const ret = {
        weaponId: nftId,
        weaponStars,
        weaponElement,
        stat1Element,
        stat2Element,
        stat3Element,
        stat1Value,
        stat2Value,
        stat3Value,
        lowStarBurnPoints,
        fourStarBurnPoints,
        fiveStarBurnPoints,
        ownerAddress,
        blockNumber: number,
        timestamp
      }

      return ret
    }

    if (helpers.isShield(nftAddress)) {
      const shield = data
      const properties = shield._properties

      const shieldElement = helpers.getElementFromProperties(properties)
      const shieldStars = helpers.getStarsFromProperties(properties)

      const statPattern = helpers.getStatPatternFromProperties(properties)
      const stat1Element = helpers.statNumberToName(helpers.getStat1Trait(statPattern))
      const stat2Element = helpers.statNumberToName(helpers.getStat2Trait(statPattern))
      const stat3Element = helpers.statNumberToName(helpers.getStat3Trait(statPattern))

      const stat1Value = shield._stat1
      const stat2Value = shield._stat2
      const stat3Value = shield._stat3

      return {
        shieldId: nftId,
        shieldStars,
        shieldElement,
        stat1Element,
        stat2Element,
        stat3Element,
        stat1Value,
        stat2Value,
        stat3Value,
        ownerAddress,
        blockNumber: number,
        timestamp
      }
    }

    return {}
  },

  getIdKey: (nftAddress) => {
    if (helpers.isCharacter(nftAddress)) {
      return 'charId'
    }

    if (helpers.isWeapon(nftAddress)) {
      return 'weaponId'
    }

    if (helpers.isShield(nftAddress)) {
      return 'shieldId'
    }

    return ''
  },

  getTypeName: (address) => {
    if (helpers.isCharacter(address)) {
      return 'character'
    }

    if (helpers.isWeapon(address)) {
      return 'weapon'
    }

    if (helpers.isShield(address)) {
      return 'shield'
    }

    if (helpers.isCryptoBlades(address)) {
      return 'cryptoblades'
    }

    if (helpers.isStaking(address)) {
      return 'staking'
    }

    if (helpers.isToken(address)) {
      return 'token'
    }

    return ''
  },

  isNFT: (type) => {
    return ['character', 'weapon', 'shield'].includes(type)
  },

  getAddressByName: (name) => {
    switch (name) {
      case 'cryptoblades': return helpers.getCryptoBladesAddress()
      case 'staking': return helpers.getStakingAddress()
      case 'token': return helpers.getTokenAddress()
      case 'character': return helpers.getCharactersAddress()
      case 'weapon': return helpers.getWeaponsAddress()
      case 'shield': return helpers.getShieldsAddress()
      default: return helpers.getDefaultAddress()
    }
  },

  getEvent: (nftAddress) => {
    if (helpers.isCharacter(nftAddress)) {
      return 'NewCharacter'
    }

    if (helpers.isWeapon(nftAddress)) {
      return 'NewWeapon'
    }

    if (helpers.isShield(nftAddress)) {
      return 'NewShield'
    }
    return null
  },

  getEventJsonInterface: (address, event) => {
    const contract = helpers.getContractByAddress(address)

    return _.find(
      contract._jsonInterface,
      o => o.name === event && o.type === 'event'
    )
  },

  decodeLogs: (eventJsonInterface, log) => {
    return helpers.getWeb3().eth.abi.decodeLog(eventJsonInterface.inputs, log.data, log.topics.slice(1))
  }
}

module.exports = helpers
