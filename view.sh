#!/usr/bin/env bash
#
# Transport Systems Lab - Hugo View Scrip 

# Checks whether we are running on MacOS
if [ "$(uname)" == "Darwin" ]; then
	bundle exec jekyll serve --open-url --livereload --trace
# Assumes that we are running under the Windows Subsystem for Linux
else 
	bundle exec jekyll serve --open-url --livereload --trace
fi