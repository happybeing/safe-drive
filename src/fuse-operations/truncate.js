const Fuse = require('fuse-bindings')
const debug = require('debug')('safe-fuse:ops')

module.exports = (safeVfs) => {
  return {
    truncate (itemPath, size, reply) {
      try {
        debug('truncate(\'%s\', %s)', itemPath, size)

        safeVfs.getHandler(itemPath)
        .then((handler) => handler.truncate(itemPath, size).then((result) => {
          if (result === null) {
            debug('truncated: %s at %s bytes', itemPath, size)
            return reply(0)
          }
          debug('truncate failed with error: ' + result.message)
          return reply(Fuse.EREMOTEIO)
        })).catch((e) => { throw e })
      } catch (err) {
        debug('Failed to truncate: ' + itemPath)
        debug(err)
        reply(Fuse.EREMOTEIO)
      }
    }
  }
}
