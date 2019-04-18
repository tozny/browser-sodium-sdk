export default class File {
  /* eslint-disable max-params */
  constructor(
    checksum,
    compression,
    size,
    writerId,
    userId,
    recordType,
    plain = {},
    fileUrl = null,
    fileName = null,
    recordId = null,
    created = null,
    lastModified = null,
    version = null
  ) {
    // Empty dict for data.
    this.data = {}
    // Base64 encoded MD5 Checksum of the Encrypted File, including E3DB Header information
    this.checksum = checksum
    // The type of compression the file is using, before encryption. Reserved for future use.
    this.compression = compression
    // Size of the encrypted file, in bytes, including E3DB Header information
    this.size = size
    this.writerId = writerId
    this.userId = userId
    this.recordType = recordType
    // Optional. Signed url used for PUT/GET to storage server
    this.fileUrl = fileUrl
    // Optional. Name of the file stored on the server. File name consists of UUID + timestamp. Returned by the server after the file has been uploaded.
    this.fileName = fileName
    // Optional. ID of the Record in a UUID format. Returned by the server after the file has been uploaded.
    this.recordId = recordId
    // Optional. Created timestamp of the file, returned by the server after the file has been uploaded.
    this.created = created
    // Optional. Last Modified timestamp of the file, returned by the server after the file has been uploaded.
    this.lastModified = lastModified
    // Optional. The version of the file based on File structure and cryptographic methods.
    this.version = version
    // Optional. Plaintext metadata attached to the File.
    this.plain = plain
  }
  /* eslint-enable maxparams */

  removeEmpty(obj) {
    /*
  Parameters
  ----------
  serialize: dict
      Dictionary to remove empty elements from
  Returns
  -------
  dict
      Dictionary with empty elements removed
  */
    for (let [key, val] of Object.entries(obj)) {
      if (val instanceof Object) {
        this.removeEmpty(val)
      } else if (!val) {
        delete obj[key]
      }
    }
    return obj
  }

  toJson() {
    /*
  Serialize the configuration as JSON-style object.
  Parameters
  ----------
  None
  Returns
  -------
  dict
      JSON-style document containing the Meta elements.
  */

    const jsonRep = {
      meta: {
        record_id: this.recordId,
        writer_id: this.writerId,
        user_id: this.userId,
        type: this.recordType,
        created: this.created,
        last_modified: this.lastModified,
        version: this.version,
        file_meta: {
          file_url: this.fileUrl,
          file_name: this.fileName,
          checksum: this.checksum,
          compression: this.compression,
          size: parseInt(this.size, 10)
        },
        plain: this.plain
      },
      data: this.data
    }

    // Remove None (JSON null) objects
    return this.removeEmpty(jsonRep)
  }
}
