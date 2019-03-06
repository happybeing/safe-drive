const Fuse = require('fuse-bindings')
const debug = require('debug')('safe-fuse:ops')

module.exports = (safeVfs) => {
  return {
    open (itemPath, flags, reply) {
      try {
        debug('open(\'%s\', %so)', itemPath, Number(flags).toString(8))

        // (https://github.com/mafintosh/fuse-bindings#opsopenpath-flags-cb)
        safeVfs.getHandler(itemPath)
        .then((handler) => handler.open(itemPath, flags).then((result) => {
          if (result.status === null && result.fileDescriptor > 0) {
            debug('opened file (%s): %s', result.fileDescriptor, itemPath)
            return reply(0, result.fileDescriptor)
          }
          debug('open failed with error: ' + result.status.message)
          return reply(Fuse.EREMOTEIO)
        })).catch((e) => { throw e })
      } catch (err) {
        debug('Failed to open file: ' + itemPath)
        debug(err)
        reply(Fuse.EREMOTEIO)
      }
    }
  }
}
