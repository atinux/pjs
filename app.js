var argv = require('yargs')
    .default('folder', './')
    .version(function() {
      return require('../package').version;
    });
