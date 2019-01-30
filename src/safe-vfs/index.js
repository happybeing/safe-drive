/* TODO theWebalyst notes:
Useful FUSE refs:
* libfuse (reference implementation) http://libfuse.github.io/doxygen/index.html
* fuse manpage (8 - system manager) http://man7.org/linux/man-pages/man8/mount.fuse.8.html
* fuse manpage (4 - coding API) http://man7.org/linux/man-pages/man4/fuse.4.html
* fuse manpage (3 - how to implement with examples) https://man.openbsd.org/fuse_main.3
* CPAN/Perl FUSE https://metacpan.org/pod/Fuse (For the Perl FUSE module but with interesting info)

NOTES:
  multithreading: fuse-bindings appears to block until each operation returns
  See https://github.com/mafintosh/fuse-bindings/issues/9#issue-105540561

[ ] implement JSDocs or similar across the code
[ ] Implement SafeVfs and vfsHandler classes according to 'DESIGN' below
  [/] refactor mount/unmount from callbacks to async/Promises so SafeVfs and handlers can use Promises
  [/] find a way to call my async functions from fuse-operatations (if not have to find a way to
      call SAFE API which I think is all async now)
    [/] SafenetworkApi:
      [/] bootstrap should set app handle on auth
      [/] need access to app handler e.g. method: safeApp()
      [/] in safenetwork-fuse change safeApi to safeJsApi
    [/] test from callSafeApi() in fuse-operations/readdir.js
  [/] refactor mount/unmount as methods on SafeVfs class and export instance of that
  [/] use SafeVfs to hold pathMap and SAFE Api (instance of SafenetworkApi)
  [/] pass safeVfs to each vfsHandler constructor
->[ ] Implement RootHandler for each of these and call from corresponding fuse-operations impn.
    [/] finish off NfsContainer in SafenetworkJs
    [/] wire up RootHandler / NfsHandler to create/use SafenetworkJs container classes
    [x] fix SAFE API error auth.getContainer('_public') - 'Container not found'
        -> It just stopped, so maybe was a Peruse state issue.
      [?] fix creation of NfsContainer so it is given a default (or other parent) container if available
          this is done by SafeVfs mountContainer()
--->[ ] I think RootHandler can be just one generic handler class, and all the MD specifics can
        be in the container classes (RootContainer and the SafenetworkJs containers).
        [ ] modify the SafeContainer FS methods to call 'this.getContainerFor()' so that
        the container getContainerFor() method returns 'this' or the appropriate child
        container, creating it if needed. So these handlers don't know anything about
        child containers, and anyone can call a FS method (listFolder etc) without
        worrying whether the container doing the work is the container, a child or
        even a grandchild container. So if you have a container for _public you
        just call listFolder() and it may be handled by the _public MD wrapper, or
        a child container wrapping an NFS container MD.
        The FUSE handlers are now *only* needed for explicit mounts. SafeContainer and
        extending classes handle the internal structures (e.g. creating child NFS containers
        within a PublicContainer, or ServicesContainers within PublicNamesContainer etc)
        [ ] modify SafeContainer to support a map of child containers
        [ ] move any needed features of NfsHandler into SafeContainer (in SafenetworkJs)
        [ ] change getContainer() to use the new functionality of SafeContainer to add handler
            for NfsContainer when accessed
        [ ] test with _public and ensure it can successfully list both the folders and the files
            in any Nfs containers referenced by _public
        [ ] rename RootHandler to PathHandler or something (now only need one class)
        [ ] delete nfs.js
    [ ] fix up inconsistencies in the design comments below, and in each of the handler files
      Note that RootHandler now caters for both '/' and for the default containers (_public, _publicNames etc)
      and that NfsHandler is used for NFS emulation MDs which will appear as part of the file
      system under _public for NFS shares, and _publicNames for services. E.g under _publicNames
      'ls' would list any public names, and under each public name any services might show
      as 'www@blog' 'email@messages', and under a service that has an NFS container, the files
      in that container (i.e. `ls _publicNames/happybeing/www@blog` would list the files and
      folders of the blog website safe://blog.happybeing).
    [/] readdir
    [/] open
    [/] read
    [/] getattr
    [/] statfs
    [ ] mkdir
    [ ] write
    [ ] create
    [ ] unlink
    [ ] rename
    [ ] rmdir
    [ ] getattr - work out additional return settings: blocks, perm, dev, ino, nlink, rdev, blksize
    [ ] statfs - review settings
    [ ] ??? ftruncate
    [ ] ??? mknod
    [ ] ??? utimens
  [/] implement for PublicNames
  [/] implement for Services
[ ] LATER add support for CLI to configure mounting:
    SafeVfs currently hard codes a default set of path mappings, this should
    be replaced by settings from the CLI parameters, so users can choose what
    to mount and where.
[/] LATER Async: looks like I could replace with Promises (https://caolan.github.io/async/docs.html#auto)
  -> tried but didn't work so leave for later.
  -> tried again, now works :-)

SAFE-VFS - DESIGN (July 2018)
=================
IMPORTANT: these notes may not be maintained, so use to help you understand
the code, but if they become too outdated to help please either update them
or remove them.

SAFE-VFS design follows, please refer to ./docs for additional design
documentation including the master architectural diagram for SAFE Drive.

SafeVfs
-------
SafeVfs (this file) implements the Path Map containing entries which map a path
to a vfsHandler object. The Path Map contains:
- an entry for '/' with an instance of VFS RootHandler
- a top level container entry for each mount point (e.g. _publicNames, _documents etc.)
- zero or sub-path entries that are also containers
- provides a getHandler() to get the vfsHandler for a given path (see next)

FUSE Operations
---------------
Each supported FUSE operation (such as readdir, statfs etc) is implemented in
its own file in ../fuse-operations.

When called, the FUSE operation calls SafeVfs.getHandler() to get a vfsHandler
object from the map, corresponding to the target (path), or an error if this
fails. It then checks that its corresponding FUSE operation is implemented on
the handler. So if this is FUSE operation readdir() it checks for a readdir()
method on the vfsHandler object and calls it. If the method isn't present,
it returns an error.

mountHandler(safePath, lazyInitialise, {params})
----------------------------------------------------
mountHandler() creates a suitable vfsHandler instance and inserts it
into the Path Map. The class of the handler corresponds to the role of the
value at the given safePath (typically a Mutable Data object).

The returned handler object will cache any supplied 'params' (such as a key
within the container which they handle).

The 'lazyInitialise' flag determines whether to initialise immediately (to
access a Mutable Data for example), or to return immediately and delay
initialisation until needed.

getHandler()
--------------------
getHandler() checks the map for an entry for a given path. If the entry
exists, it returns the entry, a vfsHandler object.

If there is no entry matching the path, it calls itself to obtain the handler
object for the parent path. This recursion continues, and will 'unroll' once
a handler is found (which may ultimately be the root handler object for SAFE
path '/').

Once it obtains a handler object for a parent path, it calls getHandlerFor()
on that object, to obtain a handler for the contained item and returns that.

The above works for containers, but what about leaves (e.g. an NFS file)?

To cope with files, SafeVfs.getHandler() will obtain the handler for the parent
container (NFS directory) and then call getHandlerFor() on that (see below).

vfsHandler Object
-----------------
A vfsHandler object is an instance of a class such as vfsPublicNamesHandler or
vfsNfsHandler. Those classes are each implemented in their own file in
src/safe-vfs, and are required() for use in src/safe-vfs/index.js

A vfsHandler is the only thing that knows what it contains, and so provides
a method getHandlerFor(path) which checks that the path is for an item
which it contains, and if so returns a vfsHandler object for that contained
item. If the item is itself a container, this will typically mean it
creates a suitable vfsHandler object and returns this, having added it to the
PathMap. Where it contained item is a file, or a container of its own type
it can return itself because it knows how to handle FUSE operations on both.

This means that a vfsHandler class implements FUSE operation methods
which work for both itself as container (e.g. readdir, statfs etc) and on
any 'leaf' item (e.g. NFS file) which it contains.

For example vfsPublicNamesHandler.getHandlerFor('_publicNames/happybeing')
will create and return an instance of vfsServicesHandler for the public
name 'happybeing'. While vfsNfsHandler.getHandlerFor('_public/blog/') and
vfsNfsHandler.getHandlerFor('_public/blog/index.html') should return itself.

A handler object implements a FUSE operation method for each FUSE operations it
supports such as readdir(), statfs() etc. (see src/fuse-operations)

Each handler class has a constructor which takes params (eg safePath, mountPath,
lazyInit) and will probably cache API related information to speed access
to the MutableData which stores its content.

When a handler lists a container, it uses the list of items it contains to
update the pathMap (deleting or adding entries to bring it up to date) in case
any of its contents have been changed. Some (all?) handlers might update that
list for some (all?) other operations.

For example inside index.js we will have:

vfsPublicNames=require('vfsPublicNames')

// and later when adding to the PathMap:

let handler = new vfsPublicNames(safeJs, '_publicNames')
if (handler) {
  pathMap.'_publicNames' = handler
}

How Handler Classes and SafenetworkJs Container Classes Work
------------------------------------------------------------
The following explains how the VFS RootHandler / RootContainer and
SafenetworkJs SafeContainer classes work allow mounting of an NFS emulation
MD, or a ServicesContainer to allow mounting of a services MD. Note that
these MDs can be mounted either within the path of a mounted parent
container, or stand-alone without a parent.

SafenetworkJs container classes include default containers (SafeContainer,
PublicNamesContainer and NFS containers (NfsContainer and
ServicesContainer). Each is a wrapper around a Mutable Data object, and
provides a simplified way to perform common operations on the MD and
its contents.

When a SafenetworkJs container is created, it can either be stand-alone
or it can be a container within a parent. For example, an NfsContainer would
normally have as its parent, either a PublicContainer (for _public), a
PrivateContainer (for _documents, _music etc) or a ServicesContainer
(for a www service entry). In those cases the NfsContainer and its parent
collaborate to ensure each is updated appropriately for FUSE operations on one
which can affect the other such as delete or rename. Where there is no
parent for an NfsContainer it can ignore any effects that would in other
cases affect the parent.

The RootHandler for '/' is what mounts the default containers (i.e. _public,
_documents, _publicNames etc). When doing so it creates an instance of
RootHandler for each mounted container, adding this to the pathMap.
TODO check the above is what I've done

A RootHandler for a default container holds a SafenetworkJs container object
to handle operations on the container.
??? how do I create the NfsHandler for an such as _public/happybeing/www-root?
??? do I need one, if the default container (_public) knows how to perform
operations on it? Perhaps if just finds/creates the container and calls the
operation on that?

A NfsHandler is created for each mounted default container, and is what
creates the NFS container objects for any entries of the default container
if and when they are mounted.

Each such mount (of a default container MD, or an NFS file container MD) creates
an entry in the mountPath map containing an instance of either RootHandler
or NfsHandler. So there is an instance of RootHandler for the root path '/'
and for each path which is the name of a default container, such as '_public',
'_documents' etc.
TEMP NOTE:
pathMap                                           handler                               container(s)
path                      safePath
'/'                                                RootHandler('/')                       n/a
'/_public'                 _public                 RootHandler('/_public')                PublicContainer
'/_music'                  _music                  RootHandler('/_music')                 PrivateContainer
'/_public/happy/www-root'  _public/happy/www-root  NfsHandler('/_public/happy/www-root')  PublicContainer
'/some/folder'             _public/happy/www-root  NfsHandler('/_public/happy/www-root')  same instance as above
'/_publicNames'            _publicNames            RootHandler('/_publicNames')           PublicNamesContainer
'/_publicNames/happy'      _publicNames/happy      ServicesHandler('_publicNames/happy')  ServicesContainer

TODO ??? Consider having one class for NfsHandler/PublicNamesHandler/ServicesHandler
Maybe RootHandler too). I think what creates
them just needs to know which container class to obtain with safeJs.getSafeContainer.
After that I think all they do is call the container, and
possibly convert the response for FUSE. ==> I guess that's the only case where I
might need separate classes - to convert different container responses for FUSE.
  TODO [ ] Start with just NfsHandler and see how if it can do everything.

CAUTION!
So 'root' in this context means an instance of RootHandler which is either:
- *the* handler for the root of the mounted file system (i.e. what appears at the mount
point on the host file system) and which mounts default containers
- or the handler for a mounted default container (e.g. _public) which can appear
at any path within the mount point on the host system (so _public could apear
at '<mount-point>/_public' or '<mount-point>/any/path' etc).

The former root handler doesnt own a container object directly, it just
creates instances of the second type, where each root handler object holds
a corresponding SafeContainer object (e.g. PublicContainer for _public,
PrivateContainer for _documents or _music etc, PublicNamesContainer and so on).

For example, when the NFS folder _public/happybeing/www-root is mounted, in
addition to the file system root handler for path '/', the pathMap will contain
a handler entry for both the path '_public' (a RootHandler) and for
'_public/happybeing/www-root' (an NfsHandler). The RootHandler will
hold an instance of PublicContainer, the NfsHandler an instance of
NfsContainer, and the two containers will know about each other
in order to co-ordinate file operations which affect each other.

Note: this scheme also provides to mounting a RootHandler for a
ServicesContainer at an arbitrary path, although typically this
would appear under the mounted path of the corresponding public
name, which in turn would normally appear under _publicNames.

*/

const path = require('path')  // Cross platform path handling

const Fuse = require('fuse-bindings')
const debug = require('debug')('safe-fuse:vfs:index')
const mkdirp = require('mkdirp-promise')
const createSafeFuse = require('../fuse-operations')

const VfsCaching = require('./vfs-cache')
const RootHandler = require('./root')

class SafeVfs {
  constructor (safeJsApi) {
    this._safeJs = safeJsApi
    this._pathMap = new Map()
    this._vfsCache = new VfsCaching(this)
  }

  safeJs () { return this._safeJs }
  pathMap () { return this._pathMap }
  vfsCache () { return this._vfsCache }

  pathMapSet (mountPath, handler) {
    this._pathMap.set(path.normalize(mountPath), handler)
  }

  pathMapGet (mountPath) {
    return this._pathMap.get(path.normalize(mountPath))
  }

  pathMapDelete (mountPath) {
    this._pathMap.delete(path.normalize(mountPath))
  }

  isPartOfMountedPath (path) {
    let result = false
    this._pathMap.forEach((value, mountPath, pathMap) => {
      if (mountPath.indexOf(path) === 0) {
        result = true
      }
    })

    return result
  }

  async mountFuse (mountPath, opts) {
    opts = opts || {}

    try {
      return this.initialisePathMap()
      .then(() => {
        return mkdirp(mountPath)
        .then(() => {
          return new Promise((resolve, reject) => {
            Fuse.mount(mountPath, createSafeFuse(this), opts.fuse, (err) => {
              debug('Fuse.mount() at ' + mountPath)
              if (err) {
                debug('Failed to create mount point at: %s', mountPath)
                debug(err)
                reject(err)
              } else {
                resolve()
              }
            })
          })
        })
      }).catch((err) => {
        debug('ERROR - failed to mount SAFE Drive volume')
        throw err
      })
    } catch (err) {
      debug('ERROR - failed to mount SAFE Drive volume')
      throw err
    }
  }

  async unmountFuse (mountPath) {
    return new Promise((resolve, reject) => {
      return Fuse.unmount(mountPath, err => {
        if (err) {
          debug('Failed to unmount SAFE Drive volume at: %s', mountPath)
          debug(err)
          reject(err)
        } else {
          this._pathMap = new Map()
          resolve()
        }
      })
    }).catch((error) => {
      debug(error.message)
    })
  }

  /**
   * Initialise the pathMap with a RootHandler
   *
   * @return {Promise}
   */
  async initialisePathMap () {
    this._pathMap = new Map()
    return this.mountContainer({safePath: '/'}) // Always have a root handler
  }

  /**
   * get a suitable handler for an item from the pathMap (adding an entry if necessary)
   * @param  {stri} itemPath full mount path
   * @return {[type]}        a VFS handler for the item
   */
  getHandler (itemPath) {
    debug('getHandler(%s)', itemPath)
    if (itemPath === '') itemPath = '/'
    let handler = this.pathMapGet(itemPath) ||
      this.getHandler(path.dirname(itemPath))

    if (!handler) {
      throw new Error('SafeVFS getHandler() failed')
    }

    // TODO review this comment and call because the SafenetworkJs container
    //      classes now handle nesting directly, so handlers can be simpler:
    // Note: we ask the handler in case it holds containers which
    // it doesn't handle directly (e.g. PublicNames container might either
    // return itself or a ServicesContainer depending on the itemPath)
    return handler.getHandlerFor(itemPath)
  }

  /**
   * Mount SAFE container (Mutable Data)
   *
   * @param  {map} {
   *    @param  {String} safePath path describing a default SAFE container (e.g. '/_public', '/_publicNames' etc))
   *        Examples:
   *      _publicNames                 mount _publicNames container
   *      _publicNames/happybeing      mount services container for 'happybeing'
   *      _publicNames/www.happybeing  mount www container (NFS for service at www.happybeing)
   *      _publicNames/thing.happybeing mount the services container (NFS, mail etc at thing.happybeing
   *   @param {String}  safeUri if no safePath, safeUri is the full or partial safe uri in the form [safe://][serviceName.]publicName
   *        Examples for safeUri:
   *      safe://blog.happybeing
   *      safe://happbeing/documents
   *      email.happybeing
   *      happybeing
   *    @param {String}   mountPath (optional) subpath of the mount point
   *    @param  {String}  lazyInitialise (optional) if false, any API init occurs immediately
   *    @param  {String}  ContainerHandler (optional) handler class for the container type
   * }
   * @return {Promise}    the handler object for newly mounted container
   */

  async mountContainer (params) {
    debug('%s.mountContainer(%o)', this.constructor.name, params)
    params.lazyInitialise = params.lazyInitialise || false // Default values
    if (!params.mountPath) {
      if (params.safePath) {
        params.mountPath = params.safePath
      } else if (params.safeUri) {
        params.mountPath = this._makeMountPathFromUri(params.safeUri)
      }
    }

    let handler
    try {
      if (this.pathMapGet(params.mountPath)) {
        throw new Error('Mount already present at \'' + params.mountPath + '\'')
      }

      let DefaultHandlerClass
      if (params.safePath === '/' || this.safeJs().defaultContainerNames.indexOf(params.safePath) !== -1) {
        DefaultHandlerClass = RootHandler
      } else {
        DefaultHandlerClass = RootHandler  // Cater for different handlers?
      }

      let fullMountPath = params.mountPath
      if (fullMountPath[0] !== '/') {
        fullMountPath = '/' + fullMountPath
      }

      if (!params.ContainerHandlerClass) {
        params.ContainerHandlerClass = DefaultHandlerClass
      }

      handler = new params.ContainerHandlerClass(this, { safePath: params.safePath, safeUri: params.safeUri }, fullMountPath, params.lazyInitialise)
      if (params.lazyInitialise || await handler._container !== undefined) {
        this.pathMapSet(fullMountPath, handler)
        return handler
      } else {
        throw new Error('mount rejected: failed to initialise container')
      }
    } catch (err) {
      debug(err)
      return undefined
    }
  }

  unmountPath (mountPath) {
    this.pathMapDelete(mountPath)
  }

  _makeMountPathFromUri (uri) {
    let serviceName
    let publicName
    let host = this._safeJs.safeUtils.hostpart(uri)
    if (host.indexOf('.') === -1) {
      publicName = host
    } else {
      serviceName = host.split('.')[0]
      publicName = host.split('.')[1]
    }

    let basePath = '_webMounts/'
    return '/' + basePath + (serviceName ? serviceName + '.' : '') + publicName
  }
}

module.exports = SafeVfs
module.exports.SafeVfs = SafeVfs
