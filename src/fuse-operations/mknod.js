const Fuse = require('fuse-bindings')
const debug = require('debug')('safe-fuse:ops')

module.exports = (ipfs) => {
  return {
    mknod (itemPath, mode, dev, reply) {
      debug('TODO: implement fuse operation: mknod'); return reply(Fuse.EREMOTEIO)

      debug('mknod(\'%s\', %s, %s)', itemPath, mode, dev)

      ipfs.files.write(itemPath, Buffer.from(''), { create: true }, (err) => {
        if (err) {
          debug('Failed to create device node for: ', itemPath)
          debug(err)
          return reply(Fuse.EREMOTEIO)
        }
        reply(0)
      })
    }
  }
}
