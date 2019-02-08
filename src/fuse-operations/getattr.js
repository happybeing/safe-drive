const Fuse = require('fuse-bindings')
// const SafeJsApi = require('safenetworkjs')
const debug = require('debug')('safe-fuse:ops')

// See also fgetattr()
//
// Useful refs:
//
// This one omits 'blocks' which is needed (at least for directories):
//  - https://github.com/mafintosh/fuse-bindings#opsgetattrpath-cb
// This shows FUSE code retrieving the returned values:
// TODO review settings from the following ref including: blocks, perm, dev, ino, nlink, rdev, blksize
//  - https://github.com/mafintosh/fuse-bindings/blob/032ed16e234f7379fbf421c12afef592ab2a292d/fuse-bindings.cc#L749-L769
module.exports = (safeVfs) => {
  return {
    getattr (itemPath, reply) {
      try {
        debug('getattr(\'%s\')', itemPath)
        let fuseResult = safeVfs.vfsCache().getattrVirtual(itemPath)
        if (fuseResult) {
          return reply(fuseResult.returnCode, fuseResult.returnObject)
        }
        safeVfs.vfsCache().getattr(itemPath).then((result) => {
          return reply(result.returnCode, result.returnObject)
        }).catch((e) => { throw e })
      } catch (e) {
        debug(e)
        reply(Fuse.EREMOTEIO)
      }
    }
  }
}

/* NONE-CACHED CODE
module.exports = (safeVfs) => {
  return {
    getattr (itemPath, reply) {
      try {
        debug('getattr(\'%s\')', itemPath)
        safeVfs.getHandler(itemPath)
        .then((handler) => handler.getattr(itemPath).then((result) => {
          if (result === undefined) {
            debug('getattr(\'%s\') result: undefined reply(Fuse.ENOENT)', itemPath)
            reply(Fuse.ENOENT)
            return
          }

          if (result.entryType === SafeJsApi.containerTypeCodes.file ||
              result.entryType === SafeJsApi.containerTypeCodes.newFile ||
              result.entryType === SafeJsApi.containerTypeCodes.fakeContainer ||
              result.entryType === SafeJsApi.containerTypeCodes.nfsContainer ||
              result.entryType === SafeJsApi.containerTypeCodes.servicesContainer ||
              result.entryType === SafeJsApi.containerTypeCodes.defaultContainer) {
            debug('getattr(\'%s\') result type: %s', itemPath, result.entryType)
            reply(0, {
              mtime: result.modified,
              atime: result.accessed,
              ctime: result.created,
              nlink: 1,
              size: result.size,    // bytes
              // blocks: result.size, // TODO
              // perm: ?,             // TODO also: dev, ino, nlink, rdev, blksize
              // https://github.com/TooTallNate/stat-mode/blob/master/index.js
              mode: (result.isFile ? 33188 : 16877),
              uid: process.getuid ? process.getuid() : 0,
              gid: process.getgid ? process.getgid() : 0
            })
            return
          }
          // TODO implement more specific error handling like this on all fuse-ops
          if (result.entryType === SafeJsApi.containerTypeCodes.notFound) {
            debug('getattr(\'%s\') result type: %s reply(Fuse.ENOENT)', itemPath, result.entryType)
            reply(Fuse.ENOENT)
            return
          }
          throw new Error('Unhandled result.entryType: ' + result.entryType)
        })).catch((e) => {
          throw e
        })
      } catch (err) {
        debug('getattr(\'%s\') caught error. reply(Fuse.ENOENT)', itemPath)
        debug(err)
        reply(Fuse.EREMOTEIO)
      }
    }
  }
}
*/
