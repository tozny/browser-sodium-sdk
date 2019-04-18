import ClientInterface from '../index'
import EmptyCrypto from '../EmptyCrypto'

describe('Client', () => {

    it('throws if instantiated as an instance rather than a parent', () => {
        const Crypto = ClientInterface.Crypto
        expect(() => { const crypto = new Crypto() })
            .toThrow('The Crypto class must be extended with a specific (Type)Crypto class before use.')
    })

    it('calls parent method if a method is missing in the (Type)Crypto instance that inherits from Crypto', () => {
        const emptyCrypto = new EmptyCrypto()
        expect(() => emptyCrypto.decryptEak()).toThrow(`The method decryptEak must be implemented in a subclass.`)
        expect(() => emptyCrypto.encryptAk()).toThrow(`The method encryptAk must be implemented in a subclass.`)
        expect(() => emptyCrypto.decryptRecord()).toThrow(`The method decryptRecord must be implemented in a subclass.`)
        expect(() => emptyCrypto.encryptRecord()).toThrow(`The method encryptRecord must be implemented in a subclass.`)
        expect(() => emptyCrypto.verifyDocumentSignature()).toThrow(`The method verifyDocumentSignature must be implemented in a subclass.`)
        expect(() => emptyCrypto.signDocument()).toThrow(`The method signDocument must be implemented in a subclass.`)
        expect(() => emptyCrypto.b64encode()).toThrow(`The method b64encode must be implemented in a subclass.`)
        expect(() => emptyCrypto.b64decode()).toThrow(`The method b64decode must be implemented in a subclass.`)
        expect(() => emptyCrypto.randomKey()).toThrow(`The method randomKey must be implemented in a subclass.`)
        expect(() => emptyCrypto.deriveKey()).toThrow(`The method deriveKey must be implemented in a subclass.`)
        expect(() => emptyCrypto.deriveSigningKey()).toThrow(`The method deriveSigningKey must be implemented in a subclass.`)
        expect(() => emptyCrypto.deriveCryptoKey()).toThrow(`The method deriveCryptoKey must be implemented in a subclass.`)
        expect(() => emptyCrypto.deriveSymmetricKey()).toThrow(`The method deriveSymmetricKey must be implemented in a subclass.`)
        expect(() => emptyCrypto.generateKeypair()).toThrow(`The method generateKeypair must be implemented in a subclass.`)
        expect(() => emptyCrypto.generateSigningKeypair()).toThrow(`The method generateSigningKeypair must be implemented in a subclass.`)
    })
})