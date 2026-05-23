// plugins/withCustomIcons.js
const { withDangerousMod } = require('expo/config-plugins');
const path = require('path');
const fs = require('fs-extra');

module.exports = function withCustomIcons(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const drawableDir = path.join(
        config.modRequest.projectRoot,
        'android',
        'app',
        'src',
        'main',
        'res',
        'drawable'
      );
      await fs.ensureDir(drawableDir);

      // List your icon files here (exact names under assets/icons/)
      const iconFiles = [
        'description_24px.xml',
        'add_card_24px.xml',
        'password_24px.xml',
        'money_24px.xml',
      ];

      for (const file of iconFiles) {
        const src = path.join(config.modRequest.projectRoot, 'assets', 'icons', file);
        const dest = path.join(drawableDir, file.toLowerCase());
        await fs.copy(src, dest);
      }

      return config;
    },
  ]);
};
