#!/usr/bin/env bash
# Download the 8 source recordings from the shared Google Drive folder into footage/.
set -euo pipefail
cd "$(dirname "$0")/.." && mkdir -p footage && cd footage
while read -r id name; do
  [ -s "$name" ] || curl -sS -L --retry 5 -C - "https://drive.usercontent.google.com/download?id=$id&export=download&confirm=t" -o "$name"
  echo "$name"
done <<'LIST'
1Xo6bsdTJkAHsnL5A8J2wKJ--T5XPcWUs IMG_8232.MOV
1DkfmEKeuZvdVWh1ixVx2xdQgPX0etafc IMG_8233.MOV
1JnoKQdqgSucJ1c1IKHv34MO5u5jdCeRL IMG_8235.MOV
14X9LKBHy_yRV1qNarGVuRIrs9uUcNqWc IMG_8236.MOV
1tNgmJ1hWtrfa5p2sk4cJIE31gmSWUFgO IMG_8237.MOV
113LZerdoxkZ9aWVS8nj4TrliJDdhyfEK IMG_8238.MOV
1Y8764KAcZD30tIswdRT4NmnYl9oyTt_B IMG_8239.MOV
1VvQiXQF4YFhsJjHozkLdKnIiol6BOuHL IMG_8241.MOV
LIST
