const Fuse = require('fuse-bindings')
const debug = require('debug')('safe-fuse:ops')

module.exports = (safeVfs) => {
  return {
    release (itemPath, fd, reply) {
      try {
        debug('release(\'%s\', %s)', itemPath, fd)

        safeVfs.getHandler(itemPath)
        .then((handler) => handler.close(itemPath, fd).then((result) => {
          if (result === null) {
            debug('released file descriptor %s', fd)
            // Clear any virtual directories in itemPath path, in case its a new file
            return safeVfs.vfsCache().closeVirtual(itemPath).then(() => {
              return reply(0)
            }).catch((e) => { throw e })
          }
          throw result
        })).catch((e) => { throw e })
      } catch (err) {
        debug('Failed to close file: ' + itemPath)
        reply(Fuse.EREMOTEIO)
      }
    }
  }
}
