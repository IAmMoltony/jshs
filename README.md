
# jshs

jshs is a simple home server written in Node.js and powered by Express.

## Installation

1. Make sure you have node.js installed
1. Clone the repo: `git clone https://github.com/IAmMoltony/jshs`
1. In the repo folder, run `npm i`
1. Done

Now to start jshs, run `node index.js`. The default port is
8000, but it can be changed on the config.

## Configuration

Configuration is done using the `jshs-config.js` file.

- `uploadsFolder`: Folder where uploads will be stored
- `fileRoot`: Root of all files. If using an absolute path for `uploadsFolder`,
  set this to `/`. If the uploads folder is relative to the jshs root directory,
  then set to `*DIRNAME*`.
- `port`: The port on which the server will run at. 8000 is usually fine.

## Features

- Web-based interface
- Streaming uploaded video and audio
- Basic file manager
