const Fuse = require('fuse-bindings')
const debug = require('debug')('safe-fuse:ops')

module.exports = (safeVfs) => {
  return {
    mkdir (itemPath, mode, reply) {
      try {
        debug('mkdir(\'%s\', %s)', itemPath, mode)
        let fuseResult = safeVfs.vfsCache().mkdirVirtual(itemPath, mode)
        if (fuseResult) {
          return reply(fuseResult.returnCode)
        }
        reply(Fuse.EREMOTEIO)
      } catch (e) {
        debug(e)
        debug('Failed to create directory: %s', itemPath)
        return reply(Fuse.EREMOTEIO)
      }
    }
  }
}
