#!/bin/sh
# Builds public/index.html from the files in src/. Vercel runs this on every deploy.
set -e
cd "$(dirname "$0")"
{
  cat src/head.html src/body.html
  cat src/prayer.js src/learn.js src/data.js src/app1.js src/app2.js src/app3.js src/app4.js src/admin.js src/install.js src/boot.js
  printf '\n</script>\n</body>\n</html>\n'
} > public/index.html
echo "Built public/index.html ($(wc -c < public/index.html) bytes)"
