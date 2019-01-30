const Fuse = require('fuse-bindings')
const debug = require('debug')('safe-fuse:ops')

module.exports = (safeVfs) => {
  return {
    truncate (itemPath, size, reply) {
      try {
        debug('truncate(\'%s\', %s)', itemPath, size)

        safeVfs.getHandler(itemPath).truncate(itemPath, size).then((result) => {
          debug('truncated: %s at %s bytes', itemPath, size)
          reply(0)
        }).catch((e) => { throw e })
      } catch (err) {
        debug('Failed to truncate: ' + itemPath)
        debug(err)
        reply(Fuse.EREMOTEIO)
      }
    }
  }
}
