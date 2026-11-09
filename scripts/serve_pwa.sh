#!/bin/sh
set -eu
cd "$(dirname "$0")/../pwa"
echo "foama-wien preview: http://localhost:8765"
echo "Für GPS auf anderen Geräten ist HTTPS erforderlich."
python3 -m http.server 8765
