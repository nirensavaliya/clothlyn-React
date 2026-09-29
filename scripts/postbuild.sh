#!/bin/sh
set -e

cd "$(dirname "$0")/.."

# Hostinger: custom 404 page must be index.html so React Router handles the path.
cp build/index.html build/404.html

# Ensure Apache/LiteSpeed rewrite config is in the deploy bundle.
if [ -f public/.htaccess ]; then
  cp public/.htaccess build/.htaccess
fi

if [ -f public/_redirects ]; then
  cp public/_redirects build/_redirects
fi

echo ""
echo "=== Hostinger deploy (upload ALL files from build/ to public_html) ==="
echo "  Required: .htaccess  (File Manager → Show hidden files)"
echo "  Required: 404.html + index.html"
echo "  Required: admin/login/index.html  (redirects old /admin/login)"
echo ""
echo "  Admin login URL:  https://YOUR-DOMAIN/panel/login"
echo "  ( /admin/login is often blocked by nginx — use /panel/login )"
echo ""
echo "  hPanel → Advanced → Error Pages → 404 → /index.html  (or /404.html)"
echo "  Clear CDN / website cache after upload"
echo ""
