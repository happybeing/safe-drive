const Fuse = require('fuse-bindings')
const debug = require('debug')('safe-fuse:ops')

module.exports = (safeVfs) => {
  return {
    readdir (itemPath, reply) {
      try {
        debug('readdir(\'%s\')', itemPath)
        let fuseResult = safeVfs.vfsCache().readdirVirtual(itemPath)
        if (fuseResult) {
          // Add any virtual directories to the itemPath directory's listing
          fuseResult.returnObject = safeVfs.vfsCache().mergeVirtualDirs(itemPath, fuseResult.returnObject)
          debug('virtual directory result: %o', fuseResult.returnObject)
          return reply(fuseResult.returnCode, fuseResult.returnObject)
        }

        safeVfs.getHandler(itemPath)
        .then((handler) => handler.readdir(itemPath).then((result) => {
          // Add any virtual directories to the itemPath directory's listing
          result = safeVfs.vfsCache().mergeVirtualDirs(itemPath, result)
          debug('directory result: %o', result)
          return reply(0, result)
        })).catch((e) => { throw e })
      } catch (err) {
        debug('Failed to readdir: ' + itemPath)
        debug(err)
        reply(Fuse.EREMOTEIO)
      }
    }
  }
}
