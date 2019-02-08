const path = require('path')  // Cross platform path handling
const SafeJsApi = require('safenetworkjs')
const SafeContainer = require('safenetworkjs').SafeContainer

const debug = require('debug')('safe-fuse:vfs:root')

const WEB_MOUNTS_NAME = '_webMounts'

/**
 * VFS RootHandler the root ('/') container, and containers mounted at the root
 *
 * A RootHandler for '/' is always mounted to that it can act as the fallback
 * if a handler has not been created for a given item path. In that case it
 * will attempt to create a suitable handler based on the itemPath. This
 * acts like an automount for paths not yet known to the SafeVfs object's
 * pathMap.
 *
 * The RootHandler for '/' creates RootHandler objects for the default SAFE
 * containers (_public, _publicNames, _documents etc) if they don't
 * yet exist in the VFS pathMap, and does so based on the itemPath
 * rather than the mountPath which the other handlers use.
 * This is because when, for example the PublicNames handler creates
 * a ServicesHandler the itemPath is not known beforehand, whereas
 * the RootHandler for '/' always has '/' as both mountPath and itemPath.
 *
 * Each RootHandler instance holds a SafenetworkJs container, except the
 * handler for '/', which does not have a container.
 *
 * NOTE: mountPath is relative to the filesystem mount point, so
 * mountPath '/' corresponds to the path of the filesystem mount point.
 */

class RootHandler {
/**
 * Handle FUSE operations for SAFE default root containers (also implements automount)
 *
 * Constructor
 * @param {SafeVfs} safeVfs       the VFS object
 * @param {Object}  containerRef { safePath: | safeUri: }
 *                                  safePath: mounted path (either '/' or one of '_publicNames', '_public' etc)
 *                                  safeUri: full or partial safe uri, [safe://][serviceName.]publicName
 *                                  Examples for safeUri:
 *                                    safe://blog.happybeing
 *                                    safe://happbeing/documents
 *                                    email.happybeing
 *                                    happybeing
 *
 * @param {String} mountPath      where safePath appears relative to filesystem mount point
 *                                [optional] for containerRef.safeUri. If omitted, will be derived from the URI
 * @param {Boolean} lazyInitialise don't create SafenetworkJs container (no effect for a safePath of '/')
 */
  constructor (safeVfs, containerRef, mountPath, lazyInitialise) {
    this._safeVfs = safeVfs
    this._containerRef = containerRef
    this._mountPath = mountPath
    this._lazyInitialise = lazyInitialise

    if (!lazyInitialise) {
      this._container = this.initContainer(containerRef)
    }
  }

/* TODO delete
    for (var i = 0, size = defaultContainerNames.length; i < size ; i++){
      let name = defaultContainerNames[i]
      mountSafeContainer(path.join(mountPath, name), name)
    }
 */

 /**
  * Creates a RootHandler for a SAFE container and inserts it into mountPath
  * @param  {String} mountPath         where to mount
  * @param  {String} defaultContainerName safe root container name (e.g. _public)
  * @param  {String} lazyInitialise    (optional) if true, new handler won't create the safeJs container
  * @return {RootHandler}              the newly created handler
  */
  mountSafeContainer (mountPath, defaultContainerName, lazyInitialise) {
    if (!lazyInitialise) lazyInitialise = false
    return this._safeVfs.mountContainer({'mountPath': mountPath, 'safePath': defaultContainerName, 'lazyInitialise': lazyInitialise})
  }

  /**
   * get the handler for this._mountPath or item contained by it (create handler if necessary)
   *
   * See class description for more
   *
   * @param  {string} itemPath mounted path
   * @return {VfsHandler}      handler for itemPath (can be this)
   */
  async getHandlerFor (itemPath) {
    debug('getHandlerFor(%s) - containerRef: %o, mountPath: %s', itemPath, this._containerRef, this._mountPath)
    try {
      if (this._mountPath === itemPath) {
        return this // The handler for itemPath
      }

      // If this is the handler for '/' it can automount some folders
      let directory = path.dirname(itemPath)
      if (this._mountPath === '/' && directory === '/') {
        // If a defaultContainer or the web mount, try to automount it:
        let itemRoot = itemPath.split('/')[1]

        let handler
        if (this._safeVfs.safeJs().defaultContainerNames.indexOf(itemRoot) !== -1) {
          handler = await this._safeVfs.mountContainer({safePath: itemRoot})
          if (!handler) {
            // Attempt to automount a SAFE URI
            let uri = 'safe://' + itemPath.substring(WEB_MOUNTS_NAME.length + 1)
            handler = await this._safeVfs.mountContainer({safeUri: uri})
          }
        }
        if (handler) return handler
        return this // Default
      }

      if (this._mountPath === '/') {
        // Handler for '/' also handles all subpaths of a mounted path
        if (this._safeVfs.isPartOfMountedPath(itemPath)) {
          return this
        }
      } else {
        // If this RootHandler is not for '/' we will only get here if
        // there is no entry in the pathMap that's a better match than
        // us. We will have a root container, so assume it is for us
        return this
        // was: throw new Error('unexpected failure')
      }

      // This is the RootHandler for '/', so getHandlerFor() will only called
      // if there is no pathMap entry matching the start of itemPath. When this
      // happens it attempts to mount the SAFE container which corresponds
      // to the itemPath.

      // First automounts for safe URIs which are expressed as paths
      // starting with /_webMounts with subdirectories for the publicName
      // followed by the serviceName
      // So the path  /_webMounts/happybeing/www is safe://happybeing or safe://www.happybeing
      // etc. This makes it easy to mount arbitrary public websites by
      // and the path /_webMounts/maidsafe/blog is safe://blog.maidsafe
      // just lising them with ls. Such as 'ls ~/SAFE/_webMounts/maidsafe/blog'
      if (itemPath.indexOf('/' + WEB_MOUNTS_NAME) === 0) {
        let host = itemPath.split('/')[2]
        let prefix = host.split('.')[0]
        let remainder = host.split('.')[1]
        let safeUri = 'safe://' + (remainder ? prefix + '.' + remainder : prefix)

        let handler = new RootHandler(this._safeVfs, { 'safeUri': safeUri }, itemPath, false)
        if (await handler.getContainer(itemPath)) {
          this._safeVfs.pathMapSet(itemPath, handler)
          return handler
        } else {
          throw new Error('failed to create VFS handler for path: ' + itemPath)
        }
      }
    } catch (err) {
      debug('RootHandler ERROR: ' + err.message)
      debug('{ containerRef: %o, mountPath: %s %s}', this._containerRef, this._mountPath, (this._container && this._container._name ? ', ' + this._container._name : ''))
      throw err
    }
  }

  /**
   * get the SafenetworJs container for the given item
   *
   * This is called by FUSE op handlers, which can then
   * call their corresponding operation on the container.
   *
   * If the item's container is not yet mounted it will automount if:
   * - the mount path starts with a SAFE root container name
   * - the handler has been mounted but the container not initialised (ie lazyInitialise mount)
   *
   * NOTE: this does not return a Promise and will throw an error if the return
   * is not a valid container, so a returned object can always be used immediately
   *
   * @param  {String} itemPath the mountPath of the FUSE item
   * @return {[type]}          a SafenetworkJs container
   */
  async getContainer (itemPath) {
    try {
      let defaultContainerName = '/' + itemPath.split('/')[1]
      if (await this._container) {
        // Root containers hold items which all start with '/'
        if (itemPath.indexOf(defaultContainerName) !== 0) {
          let e = new Error('file does not exist')
          debug(e)
          throw e
        }
        return this._container
      }

      // Wasn't mounted by the constructor, so we do it on demand
      if (this._lazyInitialise && this._mountPath !== '/') {
        return this.initContainer(this._containerRef)
      }

      // Allow automount based on itemPath that matches a default
      // container (e.g. _public, _documents etc)
      if (!this._safeVfs.safeJs().defaultContainerNames.indexOf(defaultContainerName) === -1) {
        // The RootHandler for '/' will auto mount a default SAFE container
        // If we get here, the container of the item is not mounted yet
        let mountPath = defaultContainerName
        this.mountSafeContainer(mountPath, defaultContainerName).then((handler) => {
          if (handler) {
            return handler.getContainer(itemPath)
          }
        })
      }

      // Failed to get container, so purge mounts (ensures failed automount doesn't hang around)
      this._safeVfs.unmountPath(itemPath)
    } catch (e) { debug(e) }

    debug('WARNING getContainer() failed for path: ' + itemPath)
  }

   /**
   * Initialise this RootHandler with a SAFE container (or a RootContainer for '/')
   *
   * @param {Object}  containerRef { safePath: | safeUri: }
   *                                  safePath: mounted path (either '/' or one of '_publicNames', '_public' etc)
   *                                  safeUri: full or partial safe uri, [safe://][serviceName.]publicName
   *                                  Examples for safeUri:
   *                                    safe://blog.happybeing
   *                                    safe://happbeing/documents
   *                                    email.happybeing
   *                                    happybeing
   * @return {Object}                   a SafenetworkJs container (or VFS RootContainer for '/')
   */
  async initContainer (containerRef) {
    debug('%s.initContainer(%s) at %s', this.constructor.name, containerRef, this._mountPath)
    try {
      if (this._mountPath === '/' || this._mountPath === '/' + WEB_MOUNTS_NAME) {
        this._container = new RootContainer(this)
        return this._container
      }

      let container = await this._safeVfs.safeJs().getSafeContainer(containerRef)
      if (container) {
        this._container = container
        if (this._mountPath === undefined && containerRef.safeUri) {
          this._mountPath = this._safeVfs._makeMountPathFromUri(containerRef.safeUri)
        }
        return container
      }
    } catch (e) { debug(e) }

    debug('RootHandler.initContainer(%o) failed to create SAFE container', containerRef)
  }

  // FUSE Helpers:
  pruneMountPath (itemPath) {
    let containerPath = itemPath
    if (itemPath.indexOf(this._mountPath) === 0) containerPath = itemPath.substring(this._mountPath.length)
    if (containerPath[0] === '/') containerPath = containerPath.substring(1)
    return containerPath
  }

  /*
  Fuse ref: https://github.com/mafintosh/fuse-bindings#opsopenpath-flags-cb

  From: /usr/include/x86_64-linux-gnu/bits/fcntl-linux.h
  NOTE: fcntl.h values are octal, not hexadecimal
  #define O_ACCMODE 0003
  #define O_RDONLY  00
  #define O_WRONLY  01
  #define O_RDWR    02

  Mapping these is tricky because different apps use them in different ways
  that may not map precisely. So take care with any changes here. We map:
    O_RDONLY to NFS_FILE_MODE_READ
    O_WRONLY to NFS_FILE_MODE_APPEND
    O_RDWR   to NFS_FILE_MODE_APPEND|CONSTANTS.NFS_FILE_MODE_READ
  */
  fuseToNfsFlags (flags) {
    flags = flags & 3
    if (flags === 0) return this._safeVfs.safeJs().safeApi.CONSTANTS.NFS_FILE_MODE_READ
    if (flags === 1) return this._safeVfs.safeJs().safeApi.CONSTANTS.NFS_FILE_MODE_APPEND

    return this._safeVfs.safeJs().safeApi.CONSTANTS.NFS_FILE_MODE_APPEND |
           this._safeVfs.safeJs().safeApi.CONSTANTS.NFS_FILE_MODE_READ
  }

  // Fuse operations:
  async readdir (itemPath) {
    debug('RootHandler for %o mounted at %s readdir(\'%s\')', this._containerRef, this._mountPath, itemPath)
    let containerItem = this.pruneMountPath(itemPath)
    return (await this.getContainer(itemPath)).listFolder(containerItem).catch((e) => { debug(e) })
  }

  async mkdir (itemPath) { debug('TODO mkdir(' + itemPath + ') not implemented'); return {} }

  async statfs (itemPath) {
    debug('RootHandler for %o mounted at %s statfs(\'%s\')', this._containerRef, this._mountPath, itemPath)

    // FUSE statfs expects Uint32Values as follows:
    //
    // TODO consider how to relate these to SAFE account storage
    return {            // Meaning according to http://man7.org/linux/man-pages/man2/statfs.2.html
      bsize: 1000000,   // Optimal transfer block size
      frsize: 1000000,  // Fragment size (since Linux 2.6)
      blocks: 1000000,  // Total data blocks in filesystem
      bfree: 1000000,   // Free blocks in filesystem
      bavail: 1000000,  // Free blocks available to unprivileged user
      files: 1000000,   // Total file nodes in filesystem
      ffree: 1000000,   // Free file nodes in filesystem
      favail: 1000000,  // ?
      fsid: 1000000,    // Filesystem ID
      flag: 1000000,    // Mount flags of filesystem (since Linux 2.6.36)
      namemax: 1000000  // Maximum length of filenames
    }
  }

  async getattr (itemPath) {
    debug('RootHandler for %o mounted at %s getattr(\'%s\')', this._containerRef, this._mountPath, itemPath)
    let containerItem = this.pruneMountPath(itemPath)
    return (await this.getContainer(itemPath)).itemAttributes(containerItem).catch((e) => { debug(e) })
  }

  async fgetattr (itemPath, fd) {
    debug('RootHandler for %o mounted at %s fgetattr(\'%s\', %s)', this._containerRef, this._mountPath, itemPath, fd)
    let containerItem = this.pruneMountPath(itemPath)
    return (await this.getContainer(itemPath)).itemAttributes(containerItem, fd).catch((e) => { debug(e) })
  }

  async open (itemPath, flags) {
    debug('RootHandler for %o mounted at %s open(\'%s\')', this._containerRef, this._mountPath, itemPath)
    let containerItem = this.pruneMountPath(itemPath)
    let nfsFlags = this.fuseToNfsFlags(flags)
    return (await this.getContainer(itemPath)).openFile(containerItem, nfsFlags).catch((e) => { debug(e) })
  }

  async close (itemPath, fd) {
    debug('RootHandler for %o mounted at %s close(\'%s\')', this._containerRef, this._mountPath, itemPath)
    let containerItem = this.pruneMountPath(itemPath)
    return (await this.getContainer(itemPath)).closeFile(containerItem, fd).catch((e) => { debug(e) })
  }

  async ftruncate (itemPath, fd, size) {
    debug('RootHandler for %o mounted at %s ftruncate(\'%s\', %s, %s)', this._containerRef, this._mountPath, itemPath, fd, size)
    let containerItem = this.pruneMountPath(itemPath)
    return (await this.getContainer(itemPath))._truncateFile(containerItem, fd, size).catch((e) => { debug(e) })
  }

  async truncate (itemPath, size) {
    debug('RootHandler for %o mounted at %s truncate(\'%s\', %s)', this._containerRef, this._mountPath, itemPath, size)
    let containerItem = this.pruneMountPath(itemPath)
    return (await this.getContainer(itemPath))._truncateFile(containerItem, undefined, size).catch((e) => { debug(e) })
  }

  async read (itemPath, fd, buf, len, pos) {
    debug('RootHandler for %o mounted at %s read(\'%s\')', this._containerRef, this._mountPath, itemPath)
    let containerItem = this.pruneMountPath(itemPath)
    return (await this.getContainer(itemPath)).readFileBuf(containerItem, fd, buf, pos, len).catch((e) => { debug(e) })
  }

  async create (itemPath, flags) {
    debug('RootHandler for %o mounted at %s create(\'%s\')', this._containerRef, this._mountPath, itemPath)
    let containerItem = this.pruneMountPath(itemPath)
//    let nfsFlags = this.fuseToNfsFlags(flags)
    let container = await this.getContainer(itemPath)
    let fd = await container.createFile(containerItem).catch((e) => { debug(e) })
    if (fd) {
      // We create a cache entry for getattr() on this item so that
      // between create() and close(), getattr() will show the file
      // exists. See also SafenetworkJs containers' createFile() which
      // does the same with its cache.
      let attributesResult
      let containerOp = 'itemAttributes'
      let resultHolder = container._getResultHolderForPath(containerItem)
      if (resultHolder) attributesResult = resultHolder[containerOp]
      if (attributesResult) {
        let fuseResult = this._safeVfs.vfsCache()._makeGetattrResult(itemPath, attributesResult)
        let attributesResultsRef = {
          resultsMap: container._resultHolderMap,
          resultsKey: containerItem,
          result: attributesResult,
          'fileOperation': containerOp  // For debugging only
        }

        this._safeVfs.vfsCache()._saveResultToCache(itemPath, containerOp, fuseResult, attributesResultsRef)
      }
    }
    return fd
  }

  async write (itemPath, fd, buf, len, pos) {
    debug('RootHandler for %o mounted at %s write(\'%s\', %s, buf, %s, %s)', this._containerRef, this._mountPath, itemPath, fd, len, pos)
    let containerItem = this.pruneMountPath(itemPath)
    return (await this.getContainer(itemPath)).writeFileBuf(containerItem, fd, buf, len, pos).catch((e) => { debug(e) })
  }

  async unlink (itemPath) {
    debug('RootHandler for %o mounted at %s unlink(\'%s\')', this._containerRef, this._mountPath, itemPath)
    let containerItem = this.pruneMountPath(itemPath)
    return (await this.getContainer(itemPath)).deleteFile(containerItem).catch((e) => { debug(e) })
  }

  async rename (itemPath, newPath) {
    debug('RootHandler for %o mounted at %s rename(\'%s\', \'%s\')', this._containerRef, this._mountPath, itemPath, newPath)
    let containerItem = this.pruneMountPath(itemPath)
    let newContainerItem = this.pruneMountPath(newPath)
    return (await this.getContainer(itemPath)).renameFile(containerItem, newContainerItem, newPath).catch((e) => { debug(e) })
  }

  async rmdir (itemPath) { debug('TODO rmdir(' + itemPath + ') not implemented'); return {} }
  async mknod (itemPath) { debug('TODO mknod(' + itemPath + ') not implemented'); return {} }
  async utimens (itemPath) { debug('TODO utimens(' + itemPath + ') not implemented'); return {} }
}

/**
 * A container to mount SafeContainer containers - mimics SafeContainer
 *
 * This handler supports operations on its mount path as reflected
 * in the VFS Path Map.
 *
 * A single RootContainer handles the mountPath '/', and any number of
 * subpaths which are used as mount points for other containers.
 *
 * The root container has a list of paths it handles, which always includes
 * '/', plus any supaths (such as '_webMounts/happybeing/www',
 * '_webMounts/maidsafe/blog' etc.)

 * Although this is a stand-alone class it implements the same FS methods as
 * SafenetworkJs base container class SafeContainer. This means that the FUSE
 * operations of any handler can call the same FS implementation on this
 * and any of the classes based on SafeContainer (see SafenetworkJs container
 * classes).
 */

class RootContainer extends SafeContainer {
  constructor (rootHandler) {
    // super() params are dummy values as we only use the cache implementation
    super(undefined, '', '', '')

    this._handler = rootHandler
    // TODO delete this line this._resultHolderMap = [] // Filesystem results cached by operation and container key

    // Helpers
    this.vfs = this._handler._safeVfs
    this.safeJs = this._handler._safeJs
  }

  // Fuse operations:
  async listFolder (itemPath) {
    debug('RootContainer listFolder(' + itemPath + ')')
    let listing = []
    try {
      let isInMap = false
      if (itemPath === '') {
        isInMap = true
        this.vfs.pathMap().forEach((value, mountPath, pathMap) => {
          mountPath = mountPath.split('/')[1]
          if (mountPath.length && listing.indexOf(mountPath) === -1) {
            listing.push(mountPath)
          }
        })
      } else {
        this.vfs.pathMap().forEach((value, mountPath, pathMap) => {
          if (mountPath.indexOf(itemPath) === 1) {
            isInMap = true
            let subPath = mountPath.substring(itemPath.length + 1)
            let subFolder = subPath.split('/')[1]
            if (subFolder.length && listing.indexOf(subFolder) === -1) listing.push(subFolder)
          }
        })
      }

      if (!isInMap) throw new Error('RootContainer - item not found: ' + itemPath)
    } catch (e) { debug(e) }

    debug('listing: %o', listing)
    return listing
  }

  /**
   * Get attributes of a file or directory
   * @param  {String}  itemPath
   * @param  {Number}  fd       [optional] file descriptor (if file is open)
   * @return {Promise}          attributes object
   */
  async itemAttributes (itemPath, fd) {
    debug('%s.itemAttributes(\'%s\', %s)', this.constructor.name, itemPath, fd)

    try {
      let resultsRef = await this.itemAttributesResultsRef(itemPath, fd)
      if (resultsRef) return resultsRef.result
    } catch (e) {
      debug(e)
    }
  }

  async itemAttributesResultsRef (itemPath, fd) {
    debug('%s.itemAttributesResultsRef(\'%s\', %s)', this.constructor.name, itemPath, fd)
    try {
      let fileOperation = 'itemAttributes'

      let result

      if (itemPath === '' ||
          this.vfs.isPartOfMountedPath('/' + itemPath) ||
          itemPath.indexOf(WEB_MOUNTS_NAME) === 0) {  // Always pass '_webMounts' even if not mounted!
        const now = Date.now()
        result = {
          // Default values (for '/') compatible with SafeContainer.itemAttributes()
          // TODO improve this if SAFE accounts ever have suitable values for size etc:
          modified: now,
          accessed: now,
          created: now,
          size: 0,
          version: -1,
          'isFile': false,
          entryType: SafeJsApi.containerTypeCodes.defaultContainer
        }
      }

      if (!result) {
        debug('RootContainer - item not found: ' + itemPath)
        result = { entryType: SafeJsApi.containerTypeCodes.notFound }
      }

      return this._cacheResultForPath(itemPath, fileOperation, result)
    } catch (e) { debug(e) }
  }
}

module.exports = RootHandler
