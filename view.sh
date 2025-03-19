#!/usr/bin/env bash
#
# Transport Systems Lab - Jekyll View Script with temp directory

# Create a temporary directory for the build

export JEKYLL_ENV="production"

TEMP_DIR=$(mktemp -d)
echo "Building site to temporary directory: $TEMP_DIR"

# Clean up the temporary directory on exit
trap "rm -rf $TEMP_DIR" EXIT

# Checks whether we are running on MacOS
if [ "$(uname)" == "Darwin" ]; then
	bundle exec jekyll serve --destination $TEMP_DIR --open-url --livereload --trace
# Assumes that we are running under the Windows Subsystem for Linux
else 
	bundle exec jekyll serve --destination $TEMP_DIR --open-url --livereload --trace
fi