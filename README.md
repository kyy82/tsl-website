<div align="center" style="background-color: white; padding: 20px; border-radius: 10px;">
  <img src="https://transport-systems.imperial.ac.uk/images/logo.png" alt="Transport Systems & Logistics Laboratory Logo" width="300"/>
  <br><br>
  <img src="https://transport-systems.imperial.ac.uk/images/IMPERIAL_logo_RGB_Black_2024.svg" alt="Imperial College London Logo" width="400"/>
</div>
<br>

# Transport Systems & Logistics Laboratory Website


This repository contains the source code for the website of the Transport Systems & Logistics Laboratory at Imperial College London.

## ⚠️ IMPORTANT DEPLOYMENT WARNING ⚠️

**Pushing to the main branch will AUTOMATICALLY deploy to our live server.**

It is absolutely required that you:
1. Test all changes locally before pushing to main
2. For significant changes, work on a feature branch and create a pull request

## Prerequisites

The website is built with [Jekyll](https://jekyllrb.com/), a static site generator written in Ruby. To work with this site locally, you'll need:

- **Ruby 3.2.x** (required)
- **RubyGems** (usually comes with Ruby)
- **Bundler** (gem dependency manager)
- **Git** (for version control)

## Setup Instructions

### 1. Install Ruby 3.2.x

The project specifically requires Ruby 3.2.x. Using a different version may cause compatibility issues.

#### macOS

Using [Homebrew](https://brew.sh/):

```bash
# Install rbenv to manage Ruby versions
brew install rbenv

# Initialize rbenv
rbenv init

# Install Ruby 3.2.2
rbenv install 3.2.2
rbenv global 3.2.2

# Verify the installation
ruby -v
```

Alternatively, you can use [RVM](https://rvm.io/) or [chruby](https://github.com/postmodern/chruby).

#### Windows

We recommend using [RubyInstaller](https://rubyinstaller.org/downloads/) for Windows. Download and install Ruby 3.2.x (with Devkit).

#### Linux (Ubuntu/Debian)

```bash
# Install dependencies
sudo apt update
sudo apt install git curl libssl-dev libreadline-dev zlib1g-dev autoconf bison build-essential libyaml-dev libreadline-dev libncurses5-dev libffi-dev libgdbm-dev

# Install rbenv
git clone https://github.com/rbenv/rbenv.git ~/.rbenv
echo 'export PATH="$HOME/.rbenv/bin:$PATH"' >> ~/.bashrc
echo 'eval "$(rbenv init -)"' >> ~/.bashrc
source ~/.bashrc

# Install ruby-build
git clone https://github.com/rbenv/ruby-build.git ~/.rbenv/plugins/ruby-build

# Install Ruby 3.2.2
rbenv install 3.2.2
rbenv global 3.2.2

# Verify the installation
ruby -v
```

### 2. Clone the Repository

```bash
git clone https://github.com/tsl-imperial/tsl-website.git
cd tsl-website
```

### 3. Install Dependencies

```bash
# Install bundler
gem install bundler

# Install project dependencies
bundle install
```

## Running the Website Locally

The repository includes a convenience script for starting the local development server:

```bash
# On macOS/Linux
./view.sh

# On Windows, you can run the equivalent command:
bundle exec jekyll serve --open-url --livereload --trace
```

The website should now be accessible at [http://localhost:4000](http://localhost:4000).

## Project Structure

- `_members/`: Team member profiles
- `_posts/`: Blog posts
- `_data/`: YAML files containing structured data (publications, etc.)
- `_layouts/`: HTML templates
- `_includes/`: Reusable HTML components
- `_styles/`: SCSS stylesheets
- `_scripts/`: JavaScript files
- `images/`: Images and media files
- `_cite/`: Scripts for citation processing

## Original Documentation

This website was initially based on the [Greene Lab Website Template](https://github.com/greenelab/lab-website-template). The original documentation is available here: [**Documentation**](https://greene-lab.gitbook.io/lab-website-template-docs)

**Note:** We have since diverged significantly from the original project, as we introduced major modifications and have stopped syncing with the upstream project. Not all aspects of the original documentation apply to our implementation. Use the original documentation as a reference.

## Team Member Photos
- Team member profile photos should be placed in `images/team/`
- Use the same naming convention: `lastname-initial.jpg`
- Photos should be square format, ideally 400x400 pixels
- Compress images appropriately for web use

## Publishing Citations

To update the publications list, you can use the citation processing scripts:

```bash
./bib_update.sh
```

This will update the `_data/citations.yaml` file with the latest publication information.

## Troubleshooting

### Ruby Version Issues

If you see errors like `Your Ruby version is X.X.X, but your Gemfile specified 3.2.X`, make sure you have the correct Ruby version installed and activated.

### Jekyll Build Errors

- If you encounter errors related to missing gems, try running `bundle install` again.
- For other build errors, check the error message for specific file references and fix the issues in those files.

### WebRick Errors

If you see errors about WebRick not being available, install it:

```bash
gem install webrick
```

### POSIX-spawn Issues on macOS

We believe these issues have been fixed, but if you encounter build errors related to posix-spawn or cbor on macOS, you can try:

```bash
bundle config build.cbor --with-cflags="-Wno-incompatible-function-pointer-types"
bundle config build.posix-spawn --with-cflags="-Wno-incompatible-function-pointer-types"
bundle install
```

### Resetting Ruby Environment on macOS

If you need to completely reset your Ruby environment on macOS:

```bash
# If using rbenv:
rm -rf ~/.rbenv
# Then reinstall rbenv following the installation instructions above

# If using RVM:
rvm implode
# Then reinstall RVM

# If using system Ruby or Homebrew Ruby:
brew uninstall ruby
brew cleanup
# Then reinstall Ruby via Homebrew

# After reinstalling Ruby:
gem install bundler
cd /path/to/tsl-website
bundle install
```