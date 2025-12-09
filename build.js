const workboxBuild = require('workbox-build');
const fs = require('fs');
const path = require('path');

const build = async () => {
  // Gerar service worker com workbox
  const { count, size } = await workboxBuild.injectManifest({
    swSrc: 'src/sw.js',
    swDest: 'public/sw.js',
    globDirectory: 'public',
    globPatterns: [
      '**/*.{html,css,js,json,png,svg,ico,webp,woff2}'
    ],
    maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
  });

  console.log(`✅ Service Worker gerado com ${count} arquivos (${size} bytes)`);
  
  // Criar version.json
  const versionInfo = {
    version: process.env.npm_package_version,
    buildDate: new Date().toISOString(),
    buildId: Math.random().toString(36).substr(2, 9)
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'public/version.json'),
    JSON.stringify(versionInfo, null, 2)
  );
  
  console.log('✅ Build completo!');
};

build().catch(console.error);