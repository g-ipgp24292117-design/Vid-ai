#!/usr/bin/env bash
# Install the video toolchain: HyperFrames (npm), FFmpeg, and yt-dlp.
set -euo pipefail
cd "$(dirname "$0")/.."

if ! command -v ffmpeg >/dev/null 2>&1; then
  if command -v apt-get >/dev/null 2>&1; then
    sudo apt-get update && sudo apt-get install -y ffmpeg
  elif command -v brew >/dev/null 2>&1; then
    brew install ffmpeg
  else
    echo "Please install FFmpeg manually: https://ffmpeg.org/download.html" >&2; exit 1
  fi
fi

python3 -m pip install -U yt-dlp
npm install

ffmpeg -version | head -1
yt-dlp --version
npx hyperframes --version
