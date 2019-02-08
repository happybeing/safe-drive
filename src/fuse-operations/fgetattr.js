const Fuse = require('fuse-bindings')
const SafeJsApi = require('safenetworkjs')
const debug = require('debug')('safe-fuse:ops')

// See also getattr()
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
    fgetattr (itemPath, fd, reply) {
      try {
        debug('fgetattr(\'%s\', %s)', itemPath, fd)
        safeVfs.getHandler(itemPath)
        .then((handler) => handler.fgetattr(itemPath, fd).then((result) => {
          // TODO implement more specific error handling like this on all fuse-ops
          if (result && result.entryType === SafeJsApi.containerTypeCodes.notFound) {
            return reply(Fuse.ENOENT)
          }

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
        })).catch((e) => {
          debug(e.message + ' - for itemPath:' + itemPath)
          reply(Fuse.EREMOTEIO)
        })
      } catch (err) {
        debug('Failed to getattr: ' + itemPath)
        debug(err)
        reply(Fuse.EREMOTEIO)
      }
    }
  }
}
