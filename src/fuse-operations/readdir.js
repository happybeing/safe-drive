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
          if (result.status === null) {
            // Add any virtual directories to the itemPath directory's listing
            let listing = safeVfs.vfsCache().mergeVirtualDirs(itemPath, result.listing)
            debug('directory result: %o', listing)
            return reply(0, listing)
          }
          debug('readdir failed with error: ' + result.status.message)
          return reply(Fuse.EREMOTEIO)
        })).catch((e) => { throw e })
      } catch (err) {
        debug('Failed to readdir: ' + itemPath)
        debug(err)
        reply(Fuse.EREMOTEIO)
      }
    }
  }
}
