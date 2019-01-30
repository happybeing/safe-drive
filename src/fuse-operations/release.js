const Fuse = require('fuse-bindings')
const debug = require('debug')('safe-fuse:ops')

module.exports = (safeVfs) => {
  return {
    release (itemPath, fd, reply) {
      try {
        debug('release(\'%s\', %s)', itemPath, fd)

        safeVfs.getHandler(itemPath).close(itemPath, fd).then((result) => {
          debug('released file descriptor %s', fd)
          // Clear any virtual directories in itemPath path, in case its a new file
          return safeVfs.vfsCache().closeVirtual(itemPath).then(() => {
            reply(result ? 0 : Fuse.EREMOTEIO)
          }).catch((e) => { throw e })
        }).catch((e) => { throw e })
      } catch (err) {
        debug('Failed to close file: ' + itemPath)
        reply(Fuse.EREMOTEIO)
      }
    }
  }
}
