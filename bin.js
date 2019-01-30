#!/usr/bin/env node

const debug = require('debug')('safe-fuse:bin')
const Os = require('os')
const path = require('path')
const safeJsApi = require('safenetworkjs').SafenetworkApi
const SafeVfs = require('./src/safe-vfs')
const yargs = require('yargs')

const argv = yargs
  .option('pid', { type: 'number' }) // pid for SAFE Auth
  .option('uri', { type: 'string' }) // uri for SAFE Auth
  .help()
  .argv

const mountPath = path.join(Os.homedir(), 'SAFE')

// TODO: parameterise these? or separate out?
let appConfig = {
  id: 'safenetwork-fuse',
  name: 'SAFE Network FUSE',
  vendor: 'theWebalyst'
}

const appContainers = {
  // TODO review requested permissions here and in SafenetworkJs
  _documents: ['Read', 'Insert', 'Update', 'Delete', 'ManagePermissions'], // TODO maybe reduce defaults later
  _downloads: ['Read', 'Insert', 'Update', 'Delete', 'ManagePermissions'], // TODO maybe reduce defaults later
  _music: ['Read', 'Insert', 'Update', 'Delete', 'ManagePermissions'], // TODO maybe reduce defaults later
  // ??? _pictures: ['Read', 'Insert', 'Update', 'Delete', 'ManagePermissions'], // TODO maybe reduce defaults later
  _public: ['Read', 'Insert', 'Update', 'Delete', 'ManagePermissions'], // TODO maybe reduce defaults later
  _publicNames: ['Read', 'Insert', 'Update', 'Delete', 'ManagePermissions'], // TODO maybe reduce defaults later
  _videos: ['Read', 'Insert', 'Update', 'Delete', 'ManagePermissions'] // TODO maybe reduce defaults later
}

const containerOpts = {
  own_container: false
}

let mountFailedMessage = 'Failed to un-mount SAFE FUSE volume'
mountFailedMessage += (process.platform !== 'win32' ? '\n\nType \'sudo umount ~/SAFE\' and try again.'
        : '') // TODO insert in advice for Windows here

// Auth with Safetnetwork
let safeVfs

// TESTING
// TODO re-visit using safeJsApi.authoriseWithSafeBrowser (see commented out code below)
try {
  debug('try safeJsApi.safeApi.bootstrap()...')
  safeJsApi.safeApi.bootstrap(appConfig, appContainers, containerOpts, argv).then((safeApp) => {
    safeJsApi.setSafeApi(safeApp)
    safeJsApi._safeAppConfig = appConfig
    safeJsApi._safeAppContainers = appContainers
    safeJsApi._safeContainerOpts = containerOpts
    safeJsApi._safeAuthUri = ''  // TODO refactor to get this from safeApi.bootstrap()
    safeVfs = new SafeVfs(safeJsApi)
    safeVfs.mountFuse(mountPath, { fuse: { displayFolder: true, force: true } })
    .then(_ => Promise.all([
      // TODO replace the following fixed defaults with CLI configured mounts
      safeVfs.mountContainer({safePath: '_public'}),
      // safeVfs.mountContainer({safePath: '_documents'}),
      // safeVfs.mountContainer({safePath: '_downloads'}),
      // safeVfs.mountContainer({safePath: '_music'}),
      // safeVfs.mountContainer({safePath: '_pictures'}),
      // safeVfs.mountContainer({safePath: '_videos'}),

      safeVfs.mountContainer({safePath: '_publicNames'}),
      // safeVfs.mountContainer({safePath: '_webMounts'}),
      // safeVfs.mountContainer({safeUri: 'safe://cat.ashi'}),
      // safeVfs.mountContainer({safeUri: 'safe://home.dgeddes'}),
      // safeVfs.mountContainer({safeUri: 'safe://eye.eye'}),
      // safeVfs.mountContainer({safeUri: 'safe://heaven'}),
      // safeVfs.mountContainer({safeUri: 'safe://hello'}),
      // safeVfs.mountContainer({safeUri: 'safe://jams.demo'}),
      // safeVfs.mountContainer({safeUri: 'safe://jams.jammed'}),
      // safeVfs.mountContainer({safeUri: 'safe://myfd.rsports'})
    ]))
    .then(_ => {
      debug(`Mounted SAFE filesystem on ${mountPath}`)
    })
    .catch((err) => {
      debug(err, mountFailedMessage)
    })
  })
  .catch((err) => {
    debug(err, mountFailedMessage)
  })
} catch (err) {
  console.error(err.message)
  debug(err, mountFailedMessage)
}

// Original
// try {
//   debug('try authoriseWithSafeBrowser()...')
//   safeJsApi.authoriseWithSafeBrowser(appConfig, appContainers, containerOpts, argv)
//   .then(async (app) => {
//     safeVfs = new SafeVfs(safeJsApi)
//     safeVfs.mountFuse(mountPath, { fuse: { displayFolder: true, force: true } })
//     .then(_ => Promise.all([
//       // TODO replace the following fixed defaults with CLI configured mounts
//       safeVfs.mountContainer({safePath: '_public'}),
//       // safeVfs.mountContainer({safePath: '_documents'}),
//       // safeVfs.mountContainer({safePath: '_downloads'}),
//       // safeVfs.mountContainer({safePath: '_music'}),
//       // safeVfs.mountContainer({safePath: '_pictures'}),
//       // safeVfs.mountContainer({safePath: '_videos'}),
//       safeVfs.mountContainer({safePath: '_publicNames'})
//     ]))
//     .then(_ => {
//       debug(`Mounted SAFE filesystem on ${mountPath}`)
//     })
//     .catch((err) => {
//       debug(err, mountFailedMessage)
//     })
//   })
//   .catch((err) => {
//     debug(err, mountFailedMessage)
//   })
// } catch (err) {
//   console.error(err.message)
//   debug(err, mountFailedMessage)
// }

let destroyed = false

process.on('SIGINT', () => {
  if (destroyed) return

  destroyed = true

  try {
    safeVfs.unmountFuse(mountPath).then(() => {
      debug(`Unmounted SAFE filesystem at ${mountPath}`)
    })
  } catch (err) {
    console.error(err.message)
    let msg = 'Failed to un-mount SAFE FUSE volume'
    msg += (process.platform !== 'win32' ? '\n\nType \'sudo umount ~/SAFE\' and try again.'
            : '') // TODO insert in advice for Windows here
    debug(msg)
    debug(err)
  }
})
