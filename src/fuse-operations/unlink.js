const Fuse = require('fuse-bindings')
const debug = require('debug')('safe-fuse:ops')

module.exports = (safeVfs) => {
  return {
    unlink (itemPath, reply) {
      try {
        debug('unlink(\'%s\')', itemPath)
        safeVfs.getHandler(itemPath).unlink(itemPath).then((result) => {
          debug('unlinked: %s', itemPath)
          if (result.wasLastItem) {
            // Make a virtual directory to replace the fake-container at parentDir
            let parentDir = safeVfs.safeJs().parentPathNoDot(itemPath)
            if (parentDir !== '') safeVfs.vfsCache().mkdirVirtual(parentDir)
          }
          reply(0)
        }).catch((e) => { throw e })
      } catch (err) {
        debug('Failed to unlink: ' + itemPath)
        debug(err)
        reply(Fuse.EREMOTEIO)
      }
    }
  }
}
