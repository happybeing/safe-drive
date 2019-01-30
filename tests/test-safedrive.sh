#!/bin/bash
DRIVE_PATH=~/SAFE/_public/tests/data1
SUCCESS_MESSAGE="ALL TESTS PASSED"

if [ "$1" == "" ]; then
  echo "Usage: $0 [live|mock|disk]"
  echo "Run tests on a mounted SAFE Drive. With no parameters it prints this help."
  echo "    WARNING: this test uses nearly 400 PUTs at time of writing!"
  echo ""
  echo "Parameters:"
  echo "          live - run tests on a mounted SAFE Drive (see Pre-requisites)"
  echo "          mock - as live, but using 'mock' network (see Pre-requisites)"
  echo "          disk - run tests on your local drive (see Modification)"
  echo ""
  echo "This shell script performs a sequence of operations on a mounted"
  echo "SAFE Drive and compares the results with what is expected."
  echo ""
  echo "In most cases the operations are printed to the terminal, and script"
  echo "execution will stop immediately after the first test which fails. In"
  echo "some tests, an explicit success or failure message is printed instead,"
  echo "in which case the script commands are not printed to the terminal."
  echo ""
  echo "Prints '$SUCCESS_MESSAGE' on successful execution of all tests."
  echo ""
  echo "PRE-REQUISITES:"
  echo "Tests on a mounted SAFE Drive require a container to exist at"
  echo "  '$DRIVE_PATH'"
  echo ""
  echo "You can ensure this exists by setting an environment variable that"
  echo "causes the container to be created by SAFE Drive when you issue the"
  echo "command to mount the drive. To enable this feature of SAFE Drive, use"
  echo "'SAFENETWORKJS_TESTS=testing' in your environment or as part of the"
  echo "mount command. For example:"
  echo ""
  echo "  export SAFENETWORKJS_TESTS=testing"
  echo "  mount-safe"
  echo "or"
  echo "  SAFENETWORKJS_TESTS=testing DEBUG=* node --inspect bin.js"
  echo ""
  echo "MODIFICATION:"
  echo "While making changes to the script, the 'disk' causes the tests to be"
  echo "run on your local hard drive without the need for SAFE Drive to be"
  echo "mounted."
  echo ""
  echo "Ideally structured regression tests will replace this script, see"
  echo "github issue: https://github.com/theWebalyst/safenetwork-fuse/issues/13"
  echo ""
  echo "TODO rework older play-dir tests which were originally for file mirror"
  exit
fi

if [ "$1" == "live" ]; then
  LIVE=true
  echo "Running tests on mounted SAFE Drive (LIVE network)"
fi

if [ "$1" == "mock" ]; then
  LIVE=false
  echo "Running tests on mounted SAFE Drive (MOCK network)"
fi

if [ "$1" == "disk" ]; then
  DRIVE_PATH=~
  echo "Running tests on local drive (not SAFE mount)"
fi

# Sites to list on live network, one safe://service.name and one just safe://name
WEBSITE1=cat.ashi
WEBSITE2=heaven

SAFE_DRIVE_PATH=$DRIVE_PATH/testing-safedrive
SYNCDIR=testing-safedrive-syncdir

echo Using SAFE_DRIVE_PATH = $SAFE_DRIVE_PATH
echo ""

cleanup() {
  read -p "Press enter to clear up test directories..."
  echo clearing test directories...
  rm -rf $SAFE_DRIVE_PATH tests-git
}
trap cleanup EXIT

# ------------------------ START OF TESTS -------------------------
rm -rf $SAFE_DRIVE_PATH
mkdir $SAFE_DRIVE_PATH
if [ $(which tree) ]; then tree $SAFE_DRIVE_PATH; fi

echo ""
echo "TESTING: file and directory renaming"
set -e  # Exit on error
set -v  # Echo output
mkdir $SAFE_DRIVE_PATH/dir-tree/
echo Hello1 > $SAFE_DRIVE_PATH/dir-tree/file1
mkdir $SAFE_DRIVE_PATH/dir-tree/dir-tree2
mkdir $SAFE_DRIVE_PATH/dir-tree/dir-tree2/dir-tree3
echo Hello3 > $SAFE_DRIVE_PATH/dir-tree/dir-tree2/dir-tree3/file3
if [ $(which tree) ]; then tree $SAFE_DRIVE_PATH; fi

[ "$(cat $SAFE_DRIVE_PATH/dir-tree/file1)" = "Hello1" ]
[ ! "$(mv $SAFE_DRIVE_PATH/dir-tree/file1 $SAFE_DRIVE_PATH/dir-tree/file1_newname)" ]
[ "$(cat $SAFE_DRIVE_PATH/dir-tree/file1_newname)" = "Hello1" ]
[ ! "$(mv $SAFE_DRIVE_PATH/dir-tree/dir-tree2/dir-tree3/file3 $SAFE_DRIVE_PATH/dir-tree/dir-tree2/dir-tree3/file3_newname)" ]
[ ! "$(mv $SAFE_DRIVE_PATH/dir-tree/dir-tree2/file2_newname $SAFE_DRIVE_PATH/dir-tree/dir-tree2/file2)" ]
[ "$(cat $SAFE_DRIVE_PATH/dir-tree/dir-tree2/dir-tree3/file3_newname)" = "Hello3" ]
set +v  # Don't echo output
if [ $(which tree) ]; then tree $SAFE_DRIVE_PATH; fi
echo "SUCCESS: renaming files and directories"

rm -rf $SAFE_DRIVE_PATH
mkdir $SAFE_DRIVE_PATH
if [ $(which tree) ]; then tree $SAFE_DRIVE_PATH; fi
echo ""
echo "TESTING: create & remove directory tree (dir-tree) with empty parent directory"
set -e  # Exit on error
set -v  # Echo output

mkdir $SAFE_DRIVE_PATH/del-dir

if [ $(which tree) ]; then tree $SAFE_DRIVE_PATH; fi
mkdir $SAFE_DRIVE_PATH/dir-tree/
echo Hello1 > $SAFE_DRIVE_PATH/dir-tree/file1
mkdir $SAFE_DRIVE_PATH/dir-tree/dir-tree2
echo Hello2 > $SAFE_DRIVE_PATH/dir-tree/dir-tree2/file2
mkdir $SAFE_DRIVE_PATH/dir-tree/dir-tree2/dir-tree3
echo Hello3 > $SAFE_DRIVE_PATH/dir-tree/dir-tree2/dir-tree3/file3

if [ $(which tree) ]; then tree $SAFE_DRIVE_PATH/dir-tree; fi
[ "$(cat $SAFE_DRIVE_PATH/dir-tree/file1)" = "Hello1" ]
[ "$(cat $SAFE_DRIVE_PATH/dir-tree/dir-tree2/dir-tree3/file3)" = "Hello3" ]

[ -d $SAFE_DRIVE_PATH ]
[ -d $SAFE_DRIVE_PATH/dir-tree ]
[ -d $SAFE_DRIVE_PATH/dir-tree/dir-tree2 ]
[ -d $SAFE_DRIVE_PATH/dir-tree/dir-tree2/dir-tree3 ]
[ -f $SAFE_DRIVE_PATH/dir-tree/file1 ]
[ -f $SAFE_DRIVE_PATH/dir-tree/dir-tree2/dir-tree3/file3 ]

rm -rf $SAFE_DRIVE_PATH/dir-tree
[ ! "$(cat $SAFE_DRIVE_PATH/dir-tree/file1 2>/dev/null)" ]
[ ! "$(cat $SAFE_DRIVE_PATH/dir-tree/dir-tree2/dir-tree3/file3 2>/dev/null)" = "Hello3" ]
[ ! -d $SAFE_DRIVE_PATH/dir-tree ]
[ ! -d $SAFE_DRIVE_PATH/dir-tree/dir-tree2 ]
[ ! -d $SAFE_DRIVE_PATH/dir-tree/dir-tree2/dir-tree3 ]
[ ! -f $SAFE_DRIVE_PATH/dir-tree/file ]
[ ! -f $SAFE_DRIVE_PATH/dir-tree/dir-tree2/dir-tree3/file3 ]
[ ! -d $SAFE_DRIVE_PATH/dir-tree ]
[ ! -d $SAFE_DRIVE_PATH/dir-tree ]
[ -d $SAFE_DRIVE_PATH ]
if [ $(which tree) ]; then tree $DRIVE_PATH; fi
set +v  # Don't echo output
echo "SUCCESS: remove directory tree"
echo ""

rm -rf $SAFE_DRIVE_PATH
mkdir $SAFE_DRIVE_PATH $SAFE_DRIVE_PATH/play-dir $SAFE_DRIVE_PATH/del-dir
if [ $(which tree) ]; then tree $SAFE_DRIVE_PATH; fi
echo "TESTING: file creation and modification"
echo Making files...
set -e  # Exit on error
set -v  # Echo output
echo v1 > $SAFE_DRIVE_PATH/file
echo v1 > $SAFE_DRIVE_PATH/play-dir/play-with-me
echo v1 > $SAFE_DRIVE_PATH/del-dir/delete-me

[ "$(cat $SAFE_DRIVE_PATH/file)" = "v1" ]

echo "v22" > $SAFE_DRIVE_PATH/file
[ "$(cat $SAFE_DRIVE_PATH/file)" = "v22" ]

echo "v22" > $SAFE_DRIVE_PATH/play-dir/play-with-me
[ "$(cat $SAFE_DRIVE_PATH/play-dir/play-with-me)" = "v22" ]

[ -f $SAFE_DRIVE_PATH/play-dir/play-with-me ]
rm $SAFE_DRIVE_PATH/play-dir/play-with-me
[ ! -f $SAFE_DRIVE_PATH/play-dir/play-with-me ]

[ -f $SAFE_DRIVE_PATH/del-dir/delete-me ]
rm $SAFE_DRIVE_PATH/del-dir/delete-me
[ ! -f $SAFE_DRIVE_PATH/del-dir/delete-me ]

[ "$(ls $SAFE_DRIVE_PATH/play-dir)" = "" ]
echo "foo" > $SAFE_DRIVE_PATH/play-dir/foo
[ "$(ls $SAFE_DRIVE_PATH/play-dir)" = "foo" ]
rm $SAFE_DRIVE_PATH/play-dir/foo
[ "$(ls $SAFE_DRIVE_PATH/play-dir)" = "" ]

[ -d $SAFE_DRIVE_PATH/play-dir ]
rmdir $SAFE_DRIVE_PATH/play-dir
[ ! -d $SAFE_DRIVE_PATH/play-dir ]

[ -d $SAFE_DRIVE_PATH/del-dir ]
rmdir $SAFE_DRIVE_PATH/del-dir
[ ! -d $SAFE_DRIVE_PATH/del-dir ]

! echo v1 > $SAFE_DRIVE_PATH/del-dir/foo 2>/dev/null

# Catch another past bug
[ ! -d $SAFE_DRIVE_PATH/del-dir ]
mkdir $SAFE_DRIVE_PATH/del-dir
[ ! -f $SAFE_DRIVE_PATH/del-dir/foo ]
echo v1 > $SAFE_DRIVE_PATH/del-dir/foo
[ -f $SAFE_DRIVE_PATH/del-dir/foo ]
rm $SAFE_DRIVE_PATH/del-dir/foo
[ -d $SAFE_DRIVE_PATH/del-dir ]
rmdir $SAFE_DRIVE_PATH/del-dir
[ ! -d $SAFE_DRIVE_PATH/del-dir ]
set +v  # Don't echo output
echo "SUCCESS: file creation and modification"
echo ""

set +e  # Don't exit on error
set +v  # Don't echo output
rm -rf $SAFE_DRIVE_PATH
mkdir $SAFE_DRIVE_PATH
if [ $(which tree) ]; then tree $SAFE_DRIVE_PATH; fi
echo "TESTING: rmdir"
sleep 1
rc=0
mkdir $SAFE_DRIVE_PATH/testdir
touch $SAFE_DRIVE_PATH/testdir/testfile
rmdir $SAFE_DRIVE_PATH/testdir 2>/dev/null
if [ $? -eq 0 ]; then
  rc=1
	echo "rmdir succeeded, although it must not"
fi
rm $SAFE_DRIVE_PATH/testdir/testfile
rc=$(($rc + $?))
rmdir $SAFE_DRIVE_PATH/testdir/
rc=$(($rc + $?))
if [ $rc -ne 0 ]; then
	echo "FAILED: rmdir test"
	exit 1
else
  echo "SUCCESS: rmdir test"
fi
set -e  # Exit on error

rm -rf $SAFE_DRIVE_PATH
mkdir $SAFE_DRIVE_PATH
if [ $(which tree) ]; then tree $SAFE_DRIVE_PATH; fi
echo ""
echo "TESTING: automount of _documents"
set +v  # Don't echo output
set -e  # Exit on error
if [ -d ~/SAFE/_documents ]; then
  echo "SKIPPED: _documents is already mounted"
else
  [ -d ~/SAFE/_documents ]
  echo "SUCCESS: _documents is now mounted"
fi
set +v  # Don't echo output

rm -rf $SAFE_DRIVE_PATH
mkdir $SAFE_DRIVE_PATH
if [ $(which tree) ]; then tree $SAFE_DRIVE_PATH; fi
echo ""
echo "TESTING: git"
rm -rf tests-git  # In case left over after rsync
set -e  # Exit on error
set -v  # Echo output
if [ $(which tree) ]; then tree $DRIVE_PATH; fi
mkdir $SAFE_DRIVE_PATH/tests-git
pushd $SAFE_DRIVE_PATH/tests-git
#read -p "Press enter to git init --bare"
git init --bare
popd
git clone $SAFE_DRIVE_PATH/tests-git

pushd tests-git
echo SAFE Drive test repository > README.md
git add .
git commit -m "Initial commit"
git branch test-branch
git tag test-tag -m "Its just a test"
git push --all
popd
rm -rf tests-git $SAFE_DRIVE_PATH/tests-git
[ ! -d $SAFE_DRIVE_PATH/tests-git ]
set +v  # Don't echo output
echo "SUCCESS: git"

echo ""
echo "TESTING: rsync - small test"
# TODO test with '-a' after implementing FUSE utimens()
# TODO test with '-X' after implementing FUSE getxattr()/setxattr() etc
set -v  # Echo output
set -e  # Exit on error
# Small tests
rm -rf $SYNCDIR $SAFE_DRIVE_PATH
mkdir $SYNCDIR
echo a short file > $SYNCDIR/a_short_file
if [ $(which tree) ]; then tree $SYNCDIR $SAFE_DRIVE_PATH; fi
rsync -r --delete $SYNCDIR/ $SAFE_DRIVE_PATH/
if [ $(which tree) ]; then tree $SYNCDIR $SAFE_DRIVE_PATH; fi
diff -r $SYNCDIR/ $SAFE_DRIVE_PATH/

rm $SYNCDIR/a_short_file
rsync -r --delete $SYNCDIR/ $SAFE_DRIVE_PATH/
diff -r $SYNCDIR/ $SAFE_DRIVE_PATH/

echo another file > $SAFE_DRIVE_PATH/another_file
rsync -r --delete $SYNCDIR/ $SAFE_DRIVE_PATH/
diff -r $SYNCDIR/ $SAFE_DRIVE_PATH/

echo a third file > $SAFE_DRIVE_PATH/a_third_file
rsync -r --delete $SAFE_DRIVE_PATH/ $SYNCDIR/
diff -r $SYNCDIR/ $SAFE_DRIVE_PATH/

rm $SAFE_DRIVE_PATH/a_third_file
rsync -r --delete $SAFE_DRIVE_PATH/ $SYNCDIR/
diff -r $SYNCDIR/ $SAFE_DRIVE_PATH/

set +v  # Don't output
# Big file test
# Use a big file ~200k to test multiple writes/reads
# ../package-lock.json is suitable so use that!
set -v  # Echo output
set -e  # Exit on error
# Big file test
cp ../package-lock.json $SAFE_DRIVE_PATH
cp $SAFE_DRIVE_PATH/package-lock.json .
diff ../package-lock.json package-lock.json
rm $SAFE_DRIVE_PATH/package-lock.json ../tests/package-lock.json

set +v  # Don't output
# Big test
echo "TESTING: rsync - bigger test"
echo "creating repo on SAFE drive to test rsync..."
mkdir $SAFE_DRIVE_PATH/tests-git
pushd $SAFE_DRIVE_PATH/tests-git
git init --bare
popd

rm -rf $SYNCDIR
set -v  # Echo output
rsync -r --delete $SAFE_DRIVE_PATH/ $SYNCDIR/
diff -r $SAFE_DRIVE_PATH/ $SYNCDIR/

echo abcd >$SYNCDIR/blah
rsync -r --delete $SYNCDIR/ $SAFE_DRIVE_PATH/
diff -r $SAFE_DRIVE_PATH/ $SYNCDIR/
rm $SYNCDIR/blah
rsync -r --delete $SYNCDIR/ $SAFE_DRIVE_PATH/
diff -r $SAFE_DRIVE_PATH $SYNCDIR
set +v  # Don't echo output
echo "SUCCESS: rsync"

# ------ LIVE Network Tests:

set +v  # Don't echo output
set -e  # Exit on error
if [ "$LIVE" != "true" ]; then
  echo ""
  echo "TESTING: SKIPPED for LIVE network (we're not LIVE)"
fi
if [ "$LIVE" == "true" ]; then
  echo ""
  echo "TESTING: automount of _webMounts"
# currently failing:
# TODO re-instate when I change _webMounts to ENOTFOUND before it is mounted
#  if [ -d ~/SAFE/_webMounts ]; then
#    echo "SKIPPED - _webMounts is already mounted"
#  else
#    [ ! -d ~/SAFE/_webMounts ]
    echo ""
    echo "ls ~/SAFE/_webMounts/$WEBSITE1"
    ls ~/SAFE/_webMounts/$WEBSITE1
    echo ""
    echo "ls ~/SAFE/_webMounts/$WEBSITE2"
    ls ~/SAFE/_webMounts/$WEBSITE2
    [ -d ~/SAFE/_webMounts ]
    echo ""
    echo "ls ~/SAFE/_webMounts"
    ls ~/SAFE/_webMounts
    echo ""
    echo "SUCCESS: _webMounts is mounted"
#  fi
fi

set +v  # Don't echo output
cd ..
echo ""
echo $SUCCESS_MESSAGE
echo ""
echo "RECOMMENDED: re-run immediately to test incorrect caching of deleted data"
