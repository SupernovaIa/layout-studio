#!/usr/bin/env bash
# Builds the Python renderer as a wheel and copies it into the web app's
# public/ directory so Pyodide can `micropip.install("./wheels/<file>")` it
# at runtime. The wheel keeps its PEP 427 versioned filename (micropip's
# parser rejects anything else), so to make it safe to cache for a long time
# it is placed in a folder named after the first 8 hex chars of its SHA-256:
# wheels/<sha8>/<name>.whl. The manifest.json (served uncached) lists the
# current "<sha8>/<name>.whl" so the JS loader doesn't hardcode anything.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RENDERER_DIR="$ROOT/packages/renderer"
WEB_WHEELS_DIR="$ROOT/apps/web/public/wheels"

echo ":: cleaning previous build artifacts"
rm -rf "$RENDERER_DIR/dist"
rm -rf "$WEB_WHEELS_DIR"

echo ":: building wheel with uv"
(cd "$RENDERER_DIR" && uv build --wheel)

WHEEL_PATH=$(ls "$RENDERER_DIR"/dist/*.whl | head -1)
WHEEL_NAME=$(basename "$WHEEL_PATH")
if [ -z "$WHEEL_PATH" ]; then
    echo "ERROR: no wheel produced" >&2
    exit 1
fi

WHEEL_HASH=$(shasum -a 256 "$WHEEL_PATH" | cut -c1-8)
WHEEL_REL="$WHEEL_HASH/$WHEEL_NAME"

mkdir -p "$WEB_WHEELS_DIR/$WHEEL_HASH"
cp "$WHEEL_PATH" "$WEB_WHEELS_DIR/$WHEEL_REL"

cat > "$WEB_WHEELS_DIR/manifest.json" <<EOF
{
    "renderer": "$WHEEL_REL"
}
EOF

echo ":: OK"
echo "   $WEB_WHEELS_DIR/$WHEEL_REL"
