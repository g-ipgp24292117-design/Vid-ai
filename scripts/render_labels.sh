#!/usr/bin/env bash
# Render every footage label in overlays/batch.json to a transparent WebM (renders/Lnn.webm).
set -euo pipefail
cd "$(dirname "$0")/../overlays"
mkdir -p renders
n=$(python3 -c "import json;print(len(json.load(open('batch.json'))))")
for i in $(seq 0 $((n-1))); do
  out=$(printf "renders/L%02d.webm" "$i")
  [ -s "$out" ] && continue
  vars=$(python3 -c "import json,sys;r=json.load(open('batch.json'))[$i];r.pop('output',None);print(json.dumps(r,ensure_ascii=False))")
  npx hyperframes render . --format webm -o "$out" --variables "$vars" --quiet >/dev/null 2>&1 || { echo "FAILED $out"; exit 1; }
  echo "done $out"
done
