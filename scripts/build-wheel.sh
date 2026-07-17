#!/usr/bin/env bash
# Builds the Python renderer as a wheel and copies it into the web app's
# public/ directory so Pyodide can `micropip.install("./wheels/<file>")` it
# at runtime. The wheel keeps its PEP 427 versioned filename (micropip's
# parser rejects anything else); the manifest.json lists the current
# filename so the JS loader doesn't need to hardcode the version.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RENDERER_DIR="$ROOT/packages/renderer"
WEB_WHEELS_DIR="$ROOT/apps/web/public/wheels"

echo ":: cleaning previous build artifacts"
rm -rf "$RENDERER_DIR/dist"
rm -f "$WEB_WHEELS_DIR"/*.whl

echo ":: building wheel with uv"
(cd "$RENDERER_DIR" && uv build --wheel)

WHEEL_PATH=$(ls "$RENDERER_DIR"/dist/*.whl | head -1)
WHEEL_NAME=$(basename "$WHEEL_PATH")
if [ -z "$WHEEL_PATH" ]; then
    echo "ERROR: no wheel produced" >&2
    exit 1
fi

mkdir -p "$WEB_WHEELS_DIR"
cp "$WHEEL_PATH" "$WEB_WHEELS_DIR/$WHEEL_NAME"

cat > "$WEB_WHEELS_DIR/manifest.json" <<EOF
{
    "renderer": "$WHEEL_NAME"
}
EOF

echo ":: OK"
echo "   $WEB_WHEELS_DIR/$WHEEL_NAME"
