const { Interface } = require('@ethersproject/abi')
const { web3LoadBalancer } = require('./web3-helper')

async function multicall (abi, calls) {
  const interface_ = new Interface(abi)

  const calldata = calls.map((call) => [
    call.address.toLowerCase(),
    interface_.encodeFunctionData(call.name, call.params)
  ])

  const { returnData } = await web3LoadBalancer().runContract('multicall', 'aggregate', [calldata])
  const res = returnData.map((call, i) => interface_.decodeFunctionResult(calls[i].name, call))

  return res
}

module.exports = multicall
