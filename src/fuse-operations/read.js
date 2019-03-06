const Fuse = require('fuse-bindings')
const debug = require('debug')('safe-fuse:ops')

module.exports = (safeVfs) => {
  return {
    read (itemPath, fd, buf, len, pos, reply) {
      try {
        debug('read(\'%s\', %s, buf, %s, %s)', itemPath, fd, len, pos)

        safeVfs.getHandler(itemPath)
        .then((handler) => handler.read(itemPath, fd, buf, len, pos).then((result) => {
          if (result.status === null) {
            debug('read %s bytes', result.bytes)
            // debug('data: %s', buf.slice(0, result.bytes))
            return reply(result.bytes)
          }
          debug('read failed with error: ' + result.status.message)
          return reply(Fuse.EREMOTEIO)
        })).catch((e) => { throw e })
      } catch (err) {
        debug('Failed to read file: ' + itemPath)
        debug(err)
        reply(Fuse.EREMOTEIO)
      }
    }
  }
}
