const { Interface } = require('@ethersproject/abi')
const { web3LoadBalancer, getMultiCallAddress, multicallAbiPath, getWeb3 } = require('./web3-helper')

async function multicall (abi, calls, custom = false) {
  const interface_ = new Interface(abi)

  const calldata = calls.map((call) => [
    call.address.toLowerCase(),
    interface_.encodeFunctionData(call.name, call.params)
  ])

  let multiRes
  if (custom) {
    const web3 = getWeb3()
    const multi = new web3.eth.Contract(require(multicallAbiPath), getMultiCallAddress())
    multiRes = await multi.methods.aggregate(calldata).call()
  } else {
    multiRes = await web3LoadBalancer().runContract('multicall', 'aggregate', [calldata])
  }
  const { returnData } = multiRes
  const res = returnData.map((call, i) => interface_.decodeFunctionResult(calls[i].name, call))

  return res
}

async function weaponOwnerOf (nftId) {
  return web3LoadBalancer().runContract('weapon', 'ownerOf', [nftId])
}

module.exports = {
  multicall,
  weaponOwnerOf
}
