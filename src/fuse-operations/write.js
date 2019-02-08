const Fuse = require('fuse-bindings')
const debug = require('debug')('safe-fuse:ops')

module.exports = (safeVfs) => {
  return {
    write (itemPath, fd, buf, len, pos, reply) {
      try {
        debug('write(\'%s\', %s, buf, %s, %s)', itemPath, fd, len, pos)

        safeVfs.getHandler(itemPath)
        .then((handler) => handler.write(itemPath, fd, buf, len, pos).then((bytes) => {
          debug('wrote %s bytes', bytes)
          // debug('data: %s', buf.slice(0, bytes))
          reply(bytes)
        })).catch((e) => { throw e })
      } catch (err) {
        debug('Failed to write file: ' + itemPath)
        debug(err)
        reply(Fuse.EREMOTEIO)
      }
    }
  }
}
