const Fuse = require('fuse-bindings')
const debug = require('debug')('safe-fuse:ops')

module.exports = (ipfs) => {
  return {
    utimens (itemPath, atime, mtime, reply) {
      debug('TODO: implement fuse operation: utimens'); return reply(0)

      debug('utimens(\'%s\', %s, %s)', itemPath, atime, mtime)

      ipfs.files.stat(itemPath, (err) => {
        if (err && err.message === 'file does not exist') {
          ipfs.files.write(itemPath, Buffer.from(''), { create: true }, (err) => {
            if (err) {
              debug('Failed to update timestamp for: ', itemPath)
              debug(err)
              return reply(Fuse.EREMOTEIO)
            }
            reply(0)
          })
        }
        reply(0)
      })
    }
  }
}
