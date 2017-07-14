import program = require('./index');

program.executeResxToTs('app.resources', '/custom/node-resx-to-typescript/Resources', '/custom/node-resx-to-typescript/Resources/_generated');
program.executeResxToJson('/custom/node-resx-to-typescript/Resources', '/custom/node-resx-to-typescript/Resources/_generated/json');