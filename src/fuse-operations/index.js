const createCreate = require('./create')
const createFtruncate = require('./ftruncate')
const createGetattr = require('./getattr')
const createFgetattr = require('./fgetattr')
const createMkdir = require('./mkdir')
const createMknod = require('./mknod')
const createOpen = require('./open')
const createRelease = require('./release')
const createRead = require('./read')
const createReaddir = require('./readdir')
const createRename = require('./rename')
const createRmdir = require('./rmdir')
const createTruncate = require('./truncate')
const createStatfs = require('./statfs')
const createUnlink = require('./unlink')
const createUtimens = require('./utimens')
const createWrite = require('./write')

// For stubs
const Fuse = require('fuse-bindings')
const debug = require('debug')('safe-fuse:stub')

module.exports = (safeJs) => Object.assign(
  createCreate(safeJs),
  createFtruncate(safeJs),
//  createFgetattr(safeJs),
  createGetattr(safeJs),
  createMkdir(safeJs),
  createMknod(safeJs),
  createOpen(safeJs),
  createRelease(safeJs),
  createRead(safeJs),
  createReaddir(safeJs),
  createRename(safeJs),
  createRmdir(safeJs),
  createStatfs(safeJs),
  createTruncate(safeJs),
  createUnlink(safeJs),
  createUtimens(safeJs),
  createWrite(safeJs),
  // Stubs
  { init (reply) {
    debug('TODO: implement fuse operation: init()')
    return reply(0)
  }},
  { access: function (itemPath, mode, reply) {
    debug('TODO: implement fuse operation: access(%s)', itemPath)
    return reply(0)
  }},
  { flush (itemPath, fd, reply) {
    debug('TODO: implement fuse operation: flush(%s, fd)', itemPath, fd)
    return reply(0)
  }},
  { fsync (itemPath, fd, datasync, reply) {
    debug('TODO: implement fuse operation: fsync(%s, %s, datasync)', itemPath, fd)
    return reply(0)
  }},
  { fsyncdir (itemPath, fd, datasync, reply) {
    debug('TODO: implement fuse operation: fsyncdir(%s, %s)', itemPath, fd)
    return reply(0)
  }},
  { readlink (itemPath, reply) {
    debug('TODO: implement fuse operation: readlink (%s)', itemPath)
    return reply(Fuse.ENOENT)
  }},
  { chown (itemPath, uid, gid, reply) {
    debug('TODO: implement fuse operation: chown(%s, %s, %s)', itemPath, uid, gid)
    return reply(0)
  }},
  { chmod (itemPath, mode, reply) {
    debug('TODO: implement fuse operation: chmod(%s, %s)', itemPath, mode)
    return reply(0)
  }},
  // { setxattr (itemPath, name, buffer, length, offset, flags, reply) {
  //   debug('TODO: implement fuse operation: setxattr(%s, %s, buffer, %s, %s, %s)', itemPath, name, length, offset, flags)
  //   return reply(0)
  // }},
  // { getxattr (itemPath, name, buffer, length, offset, reply) {
  //   debug('TODO: implement fuse operation: getxattr(%s, %s, buffer, %s, %s)', itemPath, name, length, offset)
  //   return reply(0)
  // }},
  // { listxattr (itemPath, buffer, length, reply) {
  //   debug('TODO: implement fuse operation: listxattr(%s, %s, %s)', itemPath, buffer, length)
  //   return reply(0)
  // }},
  // { removexattr (itemPath, name, reply) {
  //   debug('TODO: implement fuse operation: removexattr(%s, %s)', itemPath, name)
  //   return reply(0)
  // }},
  { opendir (itemPath, flags, reply) {
    debug('TODO: implement fuse operation: opendir(%s, %so)', itemPath, flags.toString(8))
    return reply(0)
  }},
  { releasedir (itemPath, fd, reply) {
    debug('TODO: implement fuse operation: releasedir(%s, %s)', itemPath, fd)
    return reply(0)
  }},
  { link (itemPath, dest, reply) {
    debug('TODO: implement fuse operation: link(%s, %s)', itemPath, dest)
    return reply(0)
  }},
  { symlink (itemPath, dest, reply) {
    debug('TODO: implement fuse operation: symlink(%s, %s)', itemPath, dest)
    return reply(0)
  }},
  { destroy (reply) {
    debug('TODO: implement fuse operation: destroy()')
    return reply(0)
  }}
)
