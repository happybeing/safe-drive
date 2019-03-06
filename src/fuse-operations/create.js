const Fuse = require('fuse-bindings')
const debug = require('debug')('safe-fuse:ops')

module.exports = (safeVfs) => {
  return {
    create (itemPath, mode, reply) {
      try {
        debug('create(\'%s\', %s)', itemPath, mode)

        safeVfs.getHandler(itemPath)
        .then((handler) => handler.create(itemPath, mode)
        .then((result) => {
          if (result.status === null && result.fileDescriptor > 0) {
            debug('created file (%s): %s', result.fileDescriptor, itemPath)
            return reply(0, result.fileDescriptor)
          }
          debug('create failed with error: ', result.status.message)
          reply(Fuse.EREMOTEIO)
        })).catch((e) => { throw e })
      } catch (e) {
        debug('Failed to create file: ', itemPath)
        debug(e)
        reply(Fuse.EREMOTEIO)
      }
    }
  }
}
