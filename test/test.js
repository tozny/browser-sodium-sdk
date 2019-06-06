// describe('add', function() {
//   it('should add two numbers and return the result', function() {
//     expect(window.add(1, 2)).toBe(3)
//   })
// })

// describe('subtract', function() {
//   it('should subtract two numbers', function() {
//     expect(window.subtract(2, 1)).toBe(1)
//   })
// })

// describe('updateAppState', function() {
//   it('should push a new state into the browser history', function() {
//     window.updateAppState({
//       message: 'hi'
//     })
//     expect(window.history.state).toEqual({
//       message: 'hi'
//     })
//   })
// })

describe('window SubtleCrypto', function() {
  it('find window.crypto.subtle', function() {
    expect(window.crypto.subtle instanceof SubtleCrypto).toBe(true)
  }, 100000)
})

describe('TozStore exports on window object', function() {
  it('find window.tozStore', function() {
    expect(window.tozStore).toBeTruthy()
  }, 100000)
  it('find window.tozStore.Config', function() {
    expect(window.tozStore.Config).toBeTruthy()
  }, 100000)
  it('find window.tozStore.Client', function() {
    expect(window.tozStore.Client).toBeTruthy()
  }, 100000)
  it('find window.tozStore.tozStoreTypes', function() {
    expect(window.tozStore.tozStoreTypes).toBeTruthy()
  }, 100000)
  it('find window.tozStore.sodiumCrypto', function() {
    expect(window.tozStore.sodiumCrypto).toBeTruthy()
  }, 100000)
})
