const Fuse = require('fuse-bindings')
const debug = require('debug')('safe-fuse:ops')

module.exports = (safeVfs) => {
  return {
    create (itemPath, mode, reply) {
      try {
        debug('create(\'%s\', %s)', itemPath, mode)

        safeVfs.getHandler(itemPath)
        .then((handler) => handler.create(itemPath, mode)
        .then((fd) => {
          if (fd > 0) {
            debug('created file (%s): %s', fd, itemPath)
            return reply(0, fd)
          }
          debug('failed to create file (%s): ', fd, itemPath)
          reply(Fuse.EREMOTEIO)
        })).catch((e) => { throw e })
      } catch (e) {
        debug('failed to create file: ', itemPath)
        debug(e)
        reply(Fuse.EREMOTEIO)
      }
    }
  }
}
