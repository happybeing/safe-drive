const Fuse = require('fuse-bindings')
const debug = require('debug')('safe-fuse:ops')

module.exports = (safeVfs) => {
  return {
    rename (itemPath, newPath, reply) {
      try {
        debug('rename(\'%s\', \'%s\')', itemPath, newPath)
        let fuseResult = safeVfs.vfsCache().renameVirtual(itemPath, newPath)
        if (fuseResult) {
          debug('Renamed: %s, to: %s', itemPath, newPath)
          return reply(fuseResult.returnCode, fuseResult.returnObject)
        }

        safeVfs.getHandler(itemPath)
        .then((handler) => handler.rename(itemPath, newPath).then((result) => {
          if (result) {
            debug('Renamed: %s, to: %s', itemPath, newPath)
            // If this left itemPath parentDir empty, make a virtual directory
            // to replace the lost fake-container
            if (result.wasLastItem) {
              let parentDir = safeVfs.safeJs().parentPathNoDot(itemPath)
              if (parentDir !== '') safeVfs.vfsCache().mkdirVirtual(parentDir)
            }

            // Clear any virtual directories in newPath in case the file is on a different path
            return safeVfs.vfsCache().closeVirtual(newPath).then((result) => {
              return reply(0)
            }).catch((e) => { throw e })
          }
          debug('Rename failed - operation not supported')
          reply(Fuse.EOPNOTSUPP) // Not allowed (e.g. rename of fake-container)
        })).catch((e) => { throw e })
      } catch (err) {
        debug('Failed to rename: %s, to: %s', itemPath, newPath)
        debug(err)
        reply(Fuse.EREMOTEIO)
      }
    }
  }
}
