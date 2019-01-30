const Fuse = require('fuse-bindings')
const debug = require('debug')('safe-fuse:ops')

module.exports = (safeVfs) => {
  return {
    ftruncate (itemPath, fd, size, reply) {
      try {
        debug('ftruncate(\'%s\', %s, %s)', itemPath, fd, size)

        safeVfs.getHandler(itemPath).ftruncate(itemPath, fd, size).then((result) => {
          debug('truncated: %s (%s) at %s bytes', itemPath, fd, size)
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
