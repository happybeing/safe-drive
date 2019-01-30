const Fuse = require('fuse-bindings')
const debug = require('debug')('safe-fuse:ops')

module.exports = (safeVfs) => {
  return {
    rmdir (itemPath, reply) {
      try {
        debug('rmdir(\'%s\')', itemPath)
        safeVfs.vfsCache().rmdirVirtual(itemPath).then((fuseResult) => {
          if (fuseResult) {
            return reply(fuseResult.returnCode)
          }
          reply(Fuse.EREMOTEIO)
        }).catch((e) => { throw e })
      } catch (e) {
        debug(e)
        debug('Failed to delete directory: %s', itemPath)
        return reply(Fuse.EREMOTEIO)
      }
    }
  }
}
