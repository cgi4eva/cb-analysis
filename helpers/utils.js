const resolvePromisesInSequence = async (promises) => {
  const promise = promises.pop()

  if (promise) {
    await promise()

    await resolvePromisesInSequence(promises)
  }
}

module.exports = {
  resolvePromisesInSequence
}
