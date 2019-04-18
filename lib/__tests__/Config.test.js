
import ClientInterface from '../index'
const Config = ClientInterface.Config

describe('config', () => {
  it('has a default API url', () => {
    let c = new Config('placeholder', 'placeholder', 'placeholder', 'placeholder', 'placeholder')
    expect(c.apiUrl).not.toEqual(undefined)
  })

  it('allows API url to be overridden', () => {
    let c = new Config('placeholder', 'placeholder', 'placeholder', 'placeholder', 'placeholder', 'https://test.com')
    expect(c.apiUrl).toEqual('https://test.com')
  })
})