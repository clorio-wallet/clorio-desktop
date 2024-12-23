/**
 * TODO: Rewrite this config to ESM
 * But currently electron-builder doesn't support ESM configs
 * @see https://github.com/develar/read-config-file/issues/10
 */

/**
 * @type {() => import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
module.exports = async function () {
  const {
    getVersion
  } = await import('./version/getVersion.mjs');

  return {
    "productName": "Clorio.Wallet",
    "artifactName": "Clorio.Wallet-${version}.${ext}",
    protocols: {
      name: "Clorio Wallet",
      schemes: ["mina"]
    },
    directories: {
      output: 'dist',
      buildResources: 'buildResources',
    },
    files: ['packages/**/dist/**'],
    extraMetadata: {
      version: getVersion(),
    },
    linux: {
      target: [
        { target: "deb" },
        { target: "AppImage" },
      ]
    },
    dmg: {
      contents: [
        { x: 340, y: 270, type: 'file' },
        { x: 560, y: 270, type: 'link', path: '/Applications' },
      ],
    },
    mac: {
      target: ["dmg", "zip"],
      artifactName: "Clorio.Wallet-${version}.${ext}"
    },
  };
};
