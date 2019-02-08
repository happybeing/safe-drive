const Fuse = require('fuse-bindings')
const debug = require('debug')('safe-fuse:ops')

module.exports = (safeVfs) => {
  return {
    open (itemPath, flags, reply) {
      try {
        debug('open(\'%s\', %so)', itemPath, Number(flags).toString(8))

        // (https://github.com/mafintosh/fuse-bindings#opsopenpath-flags-cb)
        safeVfs.getHandler(itemPath)
        .then((handler) => handler.open(itemPath, flags).then((fd) => {
          if (fd > 0) {
            debug('open returning fd: %s', fd)
            return reply(0, fd)
          }
          debug('open failed: ' + fd + ', ' + itemPath)
          return reply(Fuse.EREMOTEIO)
        })).catch((e) => { throw e })
      } catch (err) {
        debug('Failed to open: ' + itemPath)
        debug(err)
        reply(Fuse.EREMOTEIO)
      }
    }
  }
}
