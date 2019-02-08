const Fuse = require('fuse-bindings')
const debug = require('debug')('safe-fuse:ops')

/* statfs - get filesystem statistics
Refs:
  http://man7.org/linux/man-pages/man2/statfs.2.html
  http://www.tutorialspoint.com/unix_system_calls/statfs.htm
*/

module.exports = (safeVfs) => {
  return {
    statfs (itemPath, reply) {
      try {
        debug('statfs(\'%s\')', itemPath)
        safeVfs.getHandler(itemPath)
        .then((handler) => handler.statfs(itemPath).then((data) => {
          debug(data)
          reply(0, data)
        })).catch((e) => { throw e })
      } catch (err) {
        debug('Failed to stat: ' + itemPath)
        debug(err)
        reply(Fuse.EREMOTEIO)
      }
    }
  }
}
