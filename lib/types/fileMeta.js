export default class FileMeta {
  constructor(size, compression, checksum, fileName = null, fileUrl = null) {
    this.size = size
    this.compression = compression
    this.checksum = checksum
    this.fileName = fileName
    this.fileUrl = fileUrl
  }
}
