[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/standard/standard)

# What is SAFE Drive?

SAFE Drive lets you access your SAFE Network storage as if it is on your local drive. It implements a virtual drive for SAFE Network on Windows, Mac OS and Linux computers, and uses the nodejs `fuse-bindings` library.

**NOTE:** only Linux is supported so far, but feel free to build for Windows or Mac and report back.

By executing the `mount-safe` command you can mount a virtual drive on your computer with the following features.

### Files (read only access)
- browse your SAFE public files as a directory under `~/SAFE/_public`
- list directories and files using the command line (e.g. `ls`, `tree` etc.)
- access any file from a regular application or the command line

### Public Names (DNS, read only access)
- browse your SAFE public names as a directory under `~/SAFE/_publicNames`
- list public names, their services, and any service container files
- access any file from a regular application or the command line

### Planned Features
- write public files (e.g. save, create, and copy to new files and directories)
- create public names and services:
    - create decentralised domains
    - upload a website to a domain
- mount web style services (e.g. RESTful LDP, WebDav, and Solid via SafenetworkJs)
- access private files (i.e. `_documents, _music, _video, _photos` etc)
- command line options to:
    - mount a single resource at a specified mount path on the SAFE drive
    - specify access permissions on a specified mounted path

Suggestions and feature requests welcome: please submit as [issues](http://github.com/theWebalyst/safenetwork-fuse/issues)

## Disclaimer
This software is made available on the condition that no warranty is attached to it and any use of the software is entirely at your own risk (see LICENSE).

## About SAFE Network
The [SAFE Network](https://safenetwork.tech/) is a truly autonomous, decentralised internet. This **Secure Access For Everyone Network** (SAFE) tackles the increasing risks to individuals, business and nation states arising from over centralisation: domination by commercial monopolies, security risks from malware, hacking, surveillance and so on. It's a new and truly open internet aligned with the original vision held by its creators and early users, with security, net neutrality and unmediated open access baked in.

The following are currently all unique to the SAFE Network (2018):

- all services are secure and decentralised, including a human readable DNS
- highly censorship resistant to DDoS, deep packet inspection and nation state filters
- truly autonomous network
- data is guaranteed to be stored and available, forever with no ongoing fees (pay once to store)
- truly decentralised 'proof of resource' (farming), and not 'proof of work' or 'proof of stake'
- scalable non-blockchain based storage not just of hashes of data, but the data itself
- scalable non-blockchain cryptographically secured currency (Safecoin) with zero transaction fees

SAFE Network operates using the resources of anonymous 'farmers' who are rewarded with Safecoin, which they can sell or use to purchase storage and other services on the network. Safecoin is efficent and scalable (non-blockchain based) secure and anonymous digital cash.

SAFE is an open source project of @maidsafe, a private company which is majority owned by a Scottish charity, both based in Scotland but which is decentralised with employees and contributors based around the globe.


# How To Use SAFE Drive
**IMPORTANT:** SAFE Drive is not currently bundled as an executable. So the instructions immediately below relating to downloading a zip file will not work until this is supported. 

You can though still use SAFE Drive by cloning the repository and running `node bin.js` in the SAFE Drive directory. See the [Development](https://github.com/theWebalyst/safenetwork-fuse/#development) section for details on how to do this.

## 1. Get an account on SAFE Network
To use SAFE Drive you will need an account on SAFE Network, which is currently in testing (see [https://safenetwork.tech/get-involved/](https://safenetwork.tech/get-involved/)).

## 2. Install SAFE Drive

Download the latest zip file for your operating system from releases and extract to a directory on your computer.

Latest downloads: [releases](https://github.com/theWebalyst/safenetwork-fuse/tree/master/releases)

## 3. Install the Dependencies for your operating system

### 3.1 Linux

We test mainly on Ubuntu 18 for now but SAFE Drive has been tried successfully on other distros, so if you succeed (or not) on another distro please create an issue to report your findings and we'll add a note below.

In addition to Ubuntu 18, we have reports of success on Arch.

To install dependencies on Ubuntu:
```
    sudo apt-get install libfuse-dev xdg-utils
```

If your distro doesn't have `libfuse-dev` try:
```
    sudo apt-get install libfuse2 xdg-utils
```

On Arch based distros try `fuse2`:
```
    sudo apt-get install fuse2 xdg-utils
```

### 3.2 Windows

Windows has not yet been tested but there is a good chance that it will now work. If you want to try it out see the development section below. See this [forum topic](https://forum.safedev.org/t/safe-drive-windows/2221?u=happybeing) for more information. Note that the code has been updated since that topic and is more likely to work with Windows now, but has not been tested. Also, some of the instructions in that topic may have been superceded due to changes in SAFE Browser, so if anything doesn't work, check back here or post a question on the forum.

### 3.3 Mac OS

Mac OS has not yet been tested but it should work as it is similar to Linux. If you want to try it out see the development section below. See this [forum topic](https://forum.safedev.org/t/safe-drive-osx/2089?u=happybeing) for more information, and [this post](https://forum.safedev.org/t/safe-drive-osx/2089/41?u=happybeing) for working around a problem with SAFE Browser authorisation on Mac OSX. Note that some of the instructions in that topic may have been superceded due to changes in SAFE Browser, so if anything doesn't work, check back here or post a question on the forum.

## 4. Login to your SAFE Account

Start the SAFE Browser and log into your SAFE account.

## 5. Mount Your SAFE Drive

a) Assuming you are in the SAFE Drive directory type: `./mount-safe`

b) SAFE Browser should come to the front asking you to authorise SAFE Drive to access your files, so click 'Authorise'.

c) Your SAFE Drive should now be mounted and you can test this as follows

### 5.1 Testing on Linux

Open another console and try some commands, such as:

```
    ls ~/SAFE
    ls ~/SAFE/_public
    ls ~/SAFE/_publicNames
    # etc
```

You can also try `tree ~/SAFE` but if you have a lot of files this can take a long time to complete as the development code has not been optimised for speed yet.

If you have uploaded files to your SAFE account you will see them in the directory listings, and you can view their contents on the terminal with `cat` or `more`, copy them to your hard drive with `cp` and so on, or open them in an application.

## Un-mount Your SAFE Drive

You can just shut down your computer, but if you wish to unmount the drive for any reason, or if it stops working.

On Linux, type:

```
    sudo umount ~/SAFE
```


If this fails, make sure you don't have any command line shells or the file manager open on a SAFE path.

If there is a problem internally, you may need to exit the process and unmount, in which case try:
```
    pkill mount-safe ; sudo umount ~/SAFE
```

## Reporting an Issue
This software is in development and you are likely to encounter bugs, minor and serious, and you can help us fix these by submitting a report of what happened as an issue.

Before doing this, please try and capture some debugging output by mounting your drive using the following command, and then repeating the process that causes the error:

On Linux, capture debugging information as follows:
```
    DEBUG=safe* ./mount-safe 2>&1 | tee debug.txt
```

This will create a file `debug.txt` next to the executable with useful logging including any error messages you see on the console. So once you trigger the error, stop the process with `pkill mount-safe` (in another window), and then upload the `debug.txt` file with the report as a [New issue](http://github.com/theWebalyst/safenetwork-fuse/issues).


# Development

Pull requests are welcome of course, so if you would like to help with development or just want to run from source, see below.

## Implementation
SAFE Drive is a command line application based on [safe-cli-boilerplate](https://github.com/theWebalyst/safe-cli-boilerplate).

It is written in NodeJS using the `fuse-bindings` and `safenetworkjs` libraries, and packaged as a stand-alone executable for Windows, Mac OS and Linux. Limitations on the packaging scheme mean that some files are placed next to the executable.

## Get the source
If you are not yet familiar with developing for SAFE Network, or have not previously used the 'mock' network to develop and test your code, please run through the [SAFE Network Nodejs Tutorial](https://hub.safedev.org/platform/nodejs/) *before* proceeding. Doing so should ensure you have all the pre-requisites and help you understand anything not made explicit in the instructions below.

### a) Clone safenetworkjs:
Remember to fork on github and then clone your fork if you intend to work on the code. The following just clones the main repo:

```
git clone https://github.com/theWebalyst/safenetworkjs
cd safenetworkjs
npm install
npm link
```

### b) Clone safenetwork-fuse:
Remember to fork on github and then clone your fork if you intend to work on the code. The following just clones the main repo:
```
git clone https://github.com/theWebalyst/safenetwork-fuse
cd safenetwork-fuse
NODE_ENV=dev npm install
npm link safenetworkjs
```
NOTE: any time you do `npm install` inside `safenetwork-fuse/` you need to redo the `npm link safenetworkjs` to ensure it finds your copy of `safenetworkjs`

### c) Install dependencies:
```
sudo apt-get install libfuse-dev libfuse2 xdg-utils
```
NOTE: you only need one of either `libfuse-dev` or `libfuse2`, and one may fail to install depending on which linux distro you have. So as long as one of them is installed your're good.

## Build for mock network

**IMPORTANT:** build is not currently working - see [Debugging with Chrom/Chromium](https://github.com/theWebalyst/safenetwork-fuse/#debugging-with-chromechromium), or feel free to get the build working and submit a PR!

Build an executable for the host OS only, the default (output in ./dist/mock):
```
export NODE_ENV=dev
npm run build-mock
```
Commands to build for Windows and Mac OS can be found in the package.json file but SAFE Drive has not been tested on them yet. Feel free to try and report back if you have success, ideally with a pull request for any fixes! :smile:

### To test with mock
Start the SAFE Browser dev build in another terminal with:
```
safe-browser --debug
```
In the browser, create an account on the mock network.

In your development terminal, in your build directory type:
```
NODE_ENV=test DEBUG=safe* ./dist/mock/mount-safe
```
You should see output to the terminal, and assuming no errors you can access your SAFE drive (at ~/SAFE on Linux).

### Debugging with Chrome/Chromium

The following command enables debug output filtered to include statements starting with `safe-fuse` or `safenetworkjs` and allows you to debug the code with the Chrome or Chromium source code debugger.

```
NODE_ENV=test DEBUG=safe-fuse*,safenetworkjs* node --inspect-brk bin.js
```

To use the debugger, start Chrome or Chromium, navigate to `about:inspect` and click on the link. The debugger will open and display the source code of the entry point.

If you want to capture the console debug output, append '2>&1| tee debug.txt' to the end of the command. This will capture a copy of the console output in debug.txt. For example:

```
NODE_ENV=test DEBUG=safe-fuse*,safenetworkjs* node --inspect-brk bin.js 2>&1 | tee debug.txt
```

## Build for live network

**IMPORTANT:** build is not currently working - see [Debugging with Chrom/Chromium](https://github.com/theWebalyst/safenetwork-fuse/#debugging-with-chromechromium), or feel free to get the build working and submit a PR!

Build an executable for the host OS only, the default (output in ./dist/prod):

```
unset NODE_ENV
npm run build
```

To test your build, start the SAFE Browser, login to your account and in another console:

```
unset NODE_ENV
./dist/prod/mount-safe
```

## Problems Building?
Before requesting help here, please follow the [SAFE Network Nodejs Tutorial](https://hub.safedev.org/platform/nodejs/) and ensure you are able to build a desktop app. That should ensure you have all the pre-requisites, and help you to understand how to test using a **mock** SAFE Network.

If you have problems with the tutorial please post on the SAFE Network [developer forum](https://forum.safedev.org) rather than here.

# Contributions
Pull requests are welcome for outstanding issues and feature requests. Please note that contributions are subject to the LICENSE (see below).

**IMPORTANT:** By submitting a pull request, you will be offering code under the LICENSE (below).

## Please Use Standard.js

Before submitting your code please consider using `Standard.js` formatting. You may also find it helps to use an editor with support for Standard.js when developing and testing. An easy way is just to use [Atom IDE](https://atom.io/packages/atom-ide-ui) with the package [ide-standardjs] (and optionally [standard-formatter](https://atom.io/packages/standard-formatter)). Or you can install NodeJS [Standard.js](https://standardjs.com/).

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/standard/standard)

# LICENSE
This project is made available under the [GPL-3.0 LICENSE](https://opensource.org/licenses/GPL-3.0) except for individual files which contain their own license so long as that file license is compatible with GPL-3.0.

The responsibility for checking this licensing is valid and that your use of this code complies lies with any person and organisation making any use of it.
