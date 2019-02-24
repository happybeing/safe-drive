#!/bin/bash
set +v  # Don't echo output
set -e  # Exit on error

# TODO:
# [/] test on live network / see if bug (below) persists
# [ ] move these todos to SAFE Drive issue(s)...
# [ ] add 'safegit fork sub-name.public-name your-public-name' which creates a fork of sub-name.public-name at sub-name.your-public-name, as follows:
#     git clone ~/SAFE/_webMounts/<public-name>/root-<sub-name>
#     git remote remove origin # we don't use 'git push origin' but safegit push (which does 'git push safegit' and then copies to SAFE)
#     git remote add upstream ~/SAFE/_webMounts/<public-name>/root-<sub-name>
#     safegit create <sub-name>.<your-public-name> # which sets up remote 'safegit'
# [ ] BUG the cp -ruv doesn't seem to do anything, so rsync is doing the work
#   -> attempt to replicate this on mock and live networks but now seems ok
# [ ] obtain <repo-name> from `git remote -v` instead of the command line so that
#     safegit push doesn't need a parameter.

usage() {
  echo ""
  echo "Usage: safegit.sh [create|push] [repo-name]"
  echo ""
  echo "Create a safegit headless repo, or push to your remote on SAFE Network"
  echo "via SAFE Drive."
  echo ""
  echo "<repo-name> must be an existing SAFE Network subname followed by '.', followed by a public name (e.g. 'dweb-blog.dgit')."
  echo ""
  echo "NOTES:"
  echo " - set SAFEGIT_DIR to override the default (HEADLESS_DIR below)"
  echo " - you must create the public names and subnames (services) of"
  echo "   <repo-name>"
  echo ""
  echo "Examples:"
  echo "   safegit.sh create <repo-name>"
  echo "if executed in a git repository will attempt to initialise a headless"
  echo "repository <repo-name> in $HEADLESS_DIR (or in $SAFEGIT_DIR if set)"
  echo "and set it as a remote: 'safegit'."
  echo ""
  echo "   safegit.sh push <repo-name>"
  echo "if executed in a git repository will push master to 'safegit',"
  echo "and then attempt to synchronise the files in the safegit headless"
  echo "repository with the corresponding directory on SAFE Drive, so that"
  echo "others can access the published remote directory using their"
  echo "SAFE Drive."
  echo ""
  echo "You can push any branch with 'git push safegit <any-branch>' and then"
  echo "a subsequent 'push' will include that branch."
  echo ""
  echo "For example, with repo-name 'dweb-blog.dgit', the SAFE drive path for"
  echo "a headless repo will be accessible to the owner at:"
  echo "  ~/SAFE/_public/dgit/root-dweb-blog"
  echo ""
  echo "Once published, anyone can mount SAFE Drive and have read-only access"
  echo "to your remote headless repo at ~/_webMounts/dweb-blog.dgit/"
}

# Headless repos are stored in $HEADLESS_DIR, but you can
# override this by setting SAFEGIT_DIR in your environment
HEADLESS_DIR=~/safegit
if [ ! "$SAFEGIT_DIR" = "" ]; then HEADLESS_DIR=$SAFEGIT_DIR ; fi

LOCAL_REPO=$(pwd)
HEADLESS_REPO=$2
PARAM_REPO=$2
HEADLESS_PATH=$HEADLESS_DIR/$HEADLESS_REPO

SAFE_SERVICE=${PARAM_REPO/\.*/}
SAFE_NAME=${PARAM_REPO/*\./}
if [ "$SAFE_SERVICE" = "" -o "$SAFE_NAME" = "" ]; then echo "Error: you must provide a valid repo-name (a subname followed by '.' followed by a public name)" && usage && exit 1; fi

SAFE_DIR=~/SAFE/_public/$SAFE_NAME
# safegit inserts 'root-' here because this is the convention SAFE Network
# uses for the directory name, holding the files for a www service:
SAFE_PATH=$SAFE_DIR/root-$SAFE_SERVICE

cleanup() {
  cd $LOCAL_REPO
}
trap cleanup EXIT

if [ ! -e "$LOCAL_REPO/.git" ]; then echo "Error, not a git repository: $LOCAL_REPO" && usage && exit 1; fi

# Create
if [ $1 = 'create' ]; then
  mkdir -p $HEADLESS_DIR
  cd $HEADLESS_DIR
  if [ -e "$PARAM_REPO" ]; then echo "Error, directory exists: $HEADLESS_DIR/$2" && usage && exit 1; fi
  set -v  # Echo output
  git init --bare $HEADLESS_REPO
  cd $LOCAL_REPO
  git remote add safegit $HEADLESS_PATH
  exit 0
fi

# Sync
if [ $1 = 'push' ]; then
  set -v  # Echo output
  git push safegit
  # read -p "Enter to cp..."
  cp -ruv $HEADLESS_PATH/* $SAFE_PATH/
  # read -p "Enter to rsync..."
  rsync -ru --delete $HEADLESS_PATH/ $SAFE_PATH
  exit 0
fi

set +v  # Don't echo output
usage
