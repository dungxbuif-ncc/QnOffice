const nodeExternals = require('webpack-node-externals');

module.exports = function (options, webpack) {
   return {
      ...options,
      externals: [
         nodeExternals({
            // Nếu muốn whitelist module nào bundle vào thì thêm vào đây
            allowlist: [],
         }),
         // Force @qnoffice/shared to be treat as external module
         // This tells webpack NOT to bundle it, but to leave the require('@qnoffice/shared') as is
         '@qnoffice/shared',
         /^@qnoffice\/shared\/.+$/,
      ],
   };
};
