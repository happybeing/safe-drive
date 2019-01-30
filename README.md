`[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/standard/standard)

# What is SAFE Drive?

SAFE Drive lets you access your SAFE Network storage as if it is on your local drive. It implements a virtual drive for SAFE Network on Windows, Mac OS and Linux computers, and uses the nodejs `fuse-bindings` library. Features:

### Files (read only access)
- access your SAFE containers under `~/SAFE` (i.e. `_public`, `_documents, _music, _video, _photos`)
- access directories and files using the command line (e.g. `ls`, `more`, `tree` etc.)
- create, save, copy and backup files using command the line (`cp`, `rsync` etc.)
- load any SAFE Drive file from a regular application (direct save not yet supported, see plans)

### Public Names (DNS, read only access)
- browse your SAFE public names under `~/SAFE/_publicNames` using `ls`
- list the services, and any service container files for each of your public names

### File Sharing
- mount the files shared via anyone's public name with `ls ~/SAFE/_webMounts/<public name>`
- read-only access any public files via the mounts under `ls ~/SAFE/_webMounts`

### Work In Progress
- support decentralised `git` by pushing to headless repositories anyone can access
- provide a locally hosted web interface for decentralised git (similar to github)
- provide a decentralised github like web app, hosted on SAFE Network

### Planned Features
- save application files to SAFE Drive (this is not reliable, so copy manually or use `rsync`)
- create public names and services:
    - create decentralised domains
    - upload a website to a domain
- mount web style services (e.g. RESTful LDP, WebDav, and Solid via SafenetworkJs)
- command line options to:
    - mount a single resource at a specified mount path on the SAFE drive
    - specify access permissions on a specified mounted path
- package SAFE Drive as an executable that can be downloaded and 'just works'

Suggestions and feature requests welcome: please submit as [issues](http://github.com/theWebalyst/safe-drive/issues)

**NOTE:** only Linux is supported so far, but feel free to test with Windows or Mac and report back - there are some notes on how to do this below.

## Disclaimer
This software is made available on the condition that no warranty is attached to it and any use of the software is entirely at your own risk (see LICENSE).

## About SAFE Network
The [SAFE Network](https://safenetwork.tech/) is a truly autonomous, decentralised internet. This **Secure Access For Everyone Network** (SAFE) tackles the increasing risks to individuals, business and nation states arising from over centralisation: domination by commercial monopolies, security risks from malware, hacking, surveillance and so on. It's a new and truly open internet aligned with the original vision held by its creators and early users, with security, net neutrality and unmediated open access baked in.

The following are currently all unique to the SAFE Network (2019):

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

SAFE Drive is currently in development so to use it you will need to set up a development environment using `git`, `yarn` and `nodejs`. 

To use SAFE Drive, follow the [How To Set-up SAFE Drive](#how-to-set-up-safe-drive) instructions. This covers how to get an account on SAFE Network, install the dependencies for your operating system, and set-up SAFE Drive for development. When you have done all that, you're ready to use SAFE Drive:

You can use SAFE Drive with the live or mock SAFE Network. To use it with the *live network*, start SAFE Browser (v11.1 or later) *non-dev* build and log into your SAFE Network account.

Then, to mount your drive at `~/SAFE`, type:
```
node bin.js
```

This will normally bring SAFE Browser to the foreground, showing a popup in the browser window requesting access to your storage on behalf of SAFE Drive, so click 'Accept', and SAFE Drive should then be mounted on your local filesystem.

If SAFE Drive has mounted successfullly there will be a directory at `~/SAFE` containing two sub-directories. So check that you get the following ouput to ensure it has mounted:

```
$ ls
_public _publicNames
```


Before trying to mount it again, ensure it is unmounted properly by typing:

```
pkill node ; sudo umount ~/SAFE
```
The above is 'overkill' but the quickest way to reset things at this stage of development.

Later SAFE Drive will be bundled as an executable for each platform. Techniques for this have been tested with a discontinued version called [safenetwork-fuse v0.1.0](https://github.com/theWebalyst/safenetwork-fuse/releases/tag/v0.1.0), based on [safe-cli-boilerplate](https://github.com/theWebalyst/safe-cli-boilerplate), but have not been updated and don't work at this time.

# How To Set-up SAFE Drive

This is the full procedure to set up everything you need for development with SAFE Network alpha2, live or mock networks.

## 1. Get an account on SAFE Network
To use SAFE Drive you will need an account on SAFE Network, which is currently in testing (see [How do I create an account](https://safenetwork.tech/get-involved/#how-do-i-create-an-account) under [https://safenetwork.tech/get-involved/](https://safenetwork.tech/get-involved/)).

## 2. Install the Dependencies for your operating system

### 2.1 Linux

We test mainly on Ubuntu 18 for now but SAFE Drive has been tried successfully on other distros, so if you succeed (or not) on another distro please create an issue to report your findings and we'll add a note below.

In addition to Ubuntu 18, we have reports of success on Debian, Arch, and Fedora.

On **Ubuntu** install dependencies with:
```
sudo apt-get install libfuse-dev xdg-utils
```

If your distro doesn't have `libfuse-dev` try:
```
sudo apt-get install libfuse2 xdg-utils
```

On **Arch** based distros try `fuse2`:
```
sudo apt-get install fuse2 xdg-utils
```

### 2.2 Windows

Windows has not yet been tested but there is a good chance that it will now work. If you want to try it out see the development section below. See this [forum topic](https://forum.safedev.org/t/safe-drive-windows/2221?u=happybeing) for more information. Note that the code has been updated since that topic and is more likely to work with Windows now, but has not been tested. Also, some of the instructions in that topic may have been superceded due to changes in SAFE Browser, so if anything doesn't work, check back here or post a question on the forum.

### 2.3 Mac OS

Mac OS has not yet been tested but it should work as it is similar to Linux. If you want to try it out see the development section below. See this [forum topic](https://forum.safedev.org/t/safe-drive-osx/2089?u=happybeing) for more information, and [this post](https://forum.safedev.org/t/safe-drive-osx/2089/41?u=happybeing) for working around a problem with SAFE Browser authorisation on Mac OSX. Note that some of the instructions in that topic may have been superceded due to changes in SAFE Browser, so if anything doesn't work, check back here or post a question on the forum.

## 3. Login to your SAFE Account

Start the SAFE Browser and log into your SAFE account. The following assumes the *live network* and *non-dev* SAFE Browser, but for development you will normally the mock network. Details of how to use the mock network that are included under [Development](#Development).

## 4. Mount Your SAFE Drive

a) Assuming you are in the SAFE Drive directory type:
```
node bin.js
```

b) SAFE Browser should come to the front asking you to authorise SAFE Drive to access your files, so click 'Authorise'. If the popup doesn't appear see the 'note' below about unmounting.

c) Your SAFE Drive should now be mounted and you can test this as follows

Note: before trying to mount SAFE Drive, ensure it is unmounted properly by typing:

```
pkill node ; sudo umount ~/SAFE
```
The above is 'overkill' but the quickest way to reset things at this stage of development.

### 4.1 Testing on Linux

If SAFE Drive has mounted successfully there will be a directory at `~/SAFE` containing two sub-directories. So open another terminal and check that you get the following ouput to ensure it has mounted:

```
$ ls
_public _publicNames
```

If that works you can try various file system commands, such as:

```
ls ~/SAFE/_public
ls ~/SAFE/_publicNames
# etc
```

If you have uploaded files to your SAFE account you will see them in the directory listings, and you can view their contents on the terminal with `cat` or `more`, copy them to your hard drive with `cp` and so on, or open them in an application.

You can also try `tree ~/SAFE` but if you have a lot of files this can take a long time to complete, particularly on the live network. Note: you may have to install `tree` first depending on your Linux distro.

## Un-mount Your SAFE Drive

You can just shut down your computer, but if you wish to unmount the drive for any reason, or if it stops working.

On Linux, type:

```
sudo umount ~/SAFE
```


If this fails, make sure you don't have any command line shells or the file manager open on a SAFE path.

If there is a problem internally, you may need to exit the process and unmount, in which case try:
```
pkill node ; sudo umount ~/SAFE
```

## Reporting an Issue
This software is in development and you are likely to encounter bugs, minor and serious, and you can help us fix these by submitting a report of what happened as an issue.

Before doing this, please try and capture some debugging output by mounting your drive using the following command, and then repeating the process that causes the error:

On Linux, capture debugging information as follows:
```
DEBUG=safe* node bin.js 2>&1 | tee debug.log
```

This will create a file `debug.log` next to the executable with useful logging including any error messages you see on the console. So once you trigger the error, stop the process with `pkill node` (in another window), and then upload the `debug.log` file with the report as a [New issue](http://github.com/theWebalyst/safe-drive/issues).

IMPORTANT: please include your operating system/distro and version, SAFE Browser version, with step by step instructions on how to replicate the problem, as well as what happened and what you expected to happen. Plus anything else you think might help, thanks!

# Development

Pull requests are welcome of course, so if you would like to help with development or just want to run from source, see below.

## Implementation
SAFE Drive is a command line application based on [safe-cli-boilerplate](https://github.com/theWebalyst/safe-cli-boilerplate).

It is written in NodeJS using the `fuse-bindings` and `safenetworkjs` libraries, and is intended to be packaged as a stand-alone executable for Windows, Mac OS and Linux. Limitations on the packaging scheme mean that some files are placed next to the executable.

NOTE: packaging is not currently supported, although early tests were done to establish feasibility using [safenetwork-fuse v0.1.0](https://github.com/theWebalyst/safenetwork-fuse/releases/tag/v0.1.0).

## Get the source
If you are not yet familiar with developing for SAFE Network, or have not previously used the 'mock' network to develop and test your code, please run through the [SAFE Network Nodejs Tutorial](https://hub.safedev.org/platform/nodejs/) *before* proceeding. Doing so should ensure you have all the pre-requisites and help you understand anything not made explicit in the instructions below.

### a) Clone safenetworkjs:
If you intend to work on the code remember to fork on github and then clone your fork. The following just clones the main repo:

```
git clone https://github.com/theWebalyst/safenetworkjs
cd safenetworkjs
yarn
yarn link
```

Note: any time you update packages here you will need to repeat the `yarn link` step or SAFE Drive will not work.

### b) Clone safe-drive:
If you intend to work on the code remember to fork on github and then clone your fork. The following just clones the main repo:
```
git clone https://github.com/theWebalyst/safe-drive
cd safe-drive
NODE_ENV=dev yarn
yarn link safenetworkjs
```

Note: any time you add or remove packages here you will need to repeat the `yarn link safenetworkjs` step or SAFE Drive will not use your copy of safentworkjs.

### c) Install dependencies:
```
sudo apt-get install libfuse-dev libfuse2 xdg-utils
```
NOTE: you only need one of either `libfuse-dev` or `libfuse2`, and one may fail to install depending on which linux distro you have. So as long as one of them is installed your're good.

### To test with mock network
Start the SAFE Browser *dev build* in another terminal with:
```
safe-browser --debug
```
In the browser, create an account on the mock network.

In `./safe-drive`, and ensure `NODE_ENV=test` is set to enable use of the mock network:
```
SAFENETWORKJS_TESTS=testing NODE_ENV=test DEBUG=safe* node bin.js
```
You should see output to the terminal, and assuming no errors the browser will come to the front and request access to your storage on behalf of SAFE Drive. On clicking 'Accept' SAFE Drive should be mounted and be accessible at ~/SAFE (on Linux).

If this does not work, check you have the latest SAFE Browswer *dev-build*.

Before mounting you should make sure SAFE Drive is not still mounted by typing:

```
pkill node ; sudo umount ~/SAFE
```

Note: `SAFENETWORKJS_TESTS=testing` is only needed when you intend to run the test scripts in `./tests`. It is a signal to SafenetworkJS that tells it to create a public container  (on your SAFE account) needed by the test scripts, if it doesn't already exist. To run the tests:
```
cd ./safe-drive/tests
./test-safedrive.sh mock 
```
Or to omit some 'expensive' tests when using the live network:
```
./test-safedrive.sh live 
```
More options are available and will be listed if you omit the parameter:
```
./test-safedrive.sh
```

### Debugging with Console `debug()` Output

SafenetworkJS and SAFE Drive use `debug` to provide decorated, filterable output to the console which is very helpful for debugging. You can control which files contribute to the debug output with the `DEBUG` environment variable.

For example, following command mounts SAFE Drive and tells it to produce debug output to the console, filtered to include statements starting with `safe-fuse` or `safenetworkjs`:

```
NODE_ENV=test DEBUG=safe-fuse*,safenetworkjs* node bin.js

```
If you want to capture the console debug output, append '2>&1 | tee debug.log' to the end of the command. This will capture a copy of the console output in debug.log. For example:
```
NODE_ENV=test DEBUG=safe-fuse*,safenetworkjs* node bin.js 2>&1 | tee debug.log
```

Each source file has it's own 'decoration' set where it imports the debug module, so see the source code to see what you should include in the `DEBUG` setting to enable or filter its output.

Note: too much debug output seems to cause SAFE Drive to stop at random points, so if you find this happening, try 'tightenitng' your `DEBUG` filters to reduce this.

Note: `fuse-bindings` generate output to the console when `DEBUG` is set, but without any decoration or filtering. So any lines that don't have decoration at the start are produced by the `fuse-bindings` module, which is also very helpful.

### Debugging with Chrome/Chromium

You can use the source code debugger in Chrome or Chromium to set breakpoints, inspect variables, view the stack and step through SAFE Drive and SafenetworkJs code.

To use the debugger, start Chrome or Chromium, navigate to `about:inspect` and click on the link. The debugger will open and display the source code of the entry point.

Then, start SAFE Drive as before but with an additional flag: `--inspect-brk` (or `--inspect` to run immediately). For example

```
NODE_ENV=test DEBUG=safe-fuse*,safenetworkjs* node --inspect-brk bin.js
```

## Problems?
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
