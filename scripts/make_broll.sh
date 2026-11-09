#!/usr/bin/env bash
# Cut the graded, muted 1080p30 B-roll clips used by the graphics scenes (graphics/assets/broll/).
# Needs the source .MOV files from the Google Drive folder in footage/.
set -euo pipefail
cd "$(dirname "$0")/../footage"
O=../graphics/assets/broll; mkdir -p "$O"
G="eq=contrast=1.07:saturation=0.93:gamma=0.97,colorbalance=rs=-0.02:bs=0.035:rm=-0.01:bm=0.015:rh=0.01:bh=-0.01"
c(){ ffmpeg -v error -y -ss "$2" -i "$1.MOV" -t "$3" -an -vf "scale=1920:1080:flags=lanczos,fps=30,$G,format=yuv420p" \
     -c:v libx264 -preset faster -crf 18 -g 30 -movflags +faststart "$O/$4.mp4"; echo "$4"; }
c IMG_8232 0 16 class;    c IMG_8232 86 32 tv;      c IMG_8232 186 18 hands
c IMG_8233 0 20 search;   c IMG_8233 19 9 card;     c IMG_8235 14 20 reading
c IMG_8236 30 20 ar;      c IMG_8237 40 20 game;    c IMG_8241 84 20 shoot
c IMG_8241 205 20 cheer;  c IMG_8241 220 18 writing
