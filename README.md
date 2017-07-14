# resx2tsjs

Source code for the resx2tsjs node module, originally forked from resx-to-ts-json

This node module converts resx files to TypeScript definition files and JSON files. 

It supports having nested resources through underscore separated keys in the resx. For example, if you have two resources in your resx with keys "Home_help" and "Home_button", the .d.ts and .json files would look like so:

```
.d.ts
Home: {
    help: string;
    button: string;
}

.json
Home: {
    help: "Help string",
    button: "Button text"
}
```
Also you can disable nested resources by pass paramater `isAllowNest` to `true`,default is `false`.
The script has two exported functions:

```
function executeResxToTs(typeScriptResourcesNamespace: string, virtualResxFolder: string, virtualTypeScriptFolder: string, isAllowNest:boolean = false): void;
function executeResxToJson(virtualResxFolder: string, virtualJsonFolder: string, isAllowNest:boolean = false,fileNameLanguage?: string): void;
```

`executeResxToTs` converts all resx files in the `virtualResxFolder` to TypeScript definition files (.d.ts) with the namespace defined as `typeScriptResourcesNamespace` and outputs these files to `virtualTypeScriptFolder`  
`executeResxToJson` converts all resx files in the `virtualResxFolder` to JSON files (.json) which can be loaded in the application and outputs them to `virtualJsonFolder`. Optionally, you can specify a `fileNameLanguage` string to append to the file name, so if "en" was specified, the filename would be filename.en.json.

# Usage

To use this node module add a reference to your project package.json dependencies.
```
{
    "dependencies": {
        "resx-to-ts-json": "1.0.14"
    }
}
```

To use the module in for instance a gulp task:

```
var resxConverter = require('resx-to-ts-json');
resxConverter.executeResxToTs('exampleApp.resources', '/Resources', '/App/Resources', true);
resxConverter.executeResxToJson('/Resources', '/App/Resources/Json', true);
```

where the parameters stand for:

'exampleApp.resources'  -> TypeScript module name / namespace for the resource models.  
'/Resources'            -> Relative folder to scan for .resx files.  
'/App/Resources'        -> Output directory for TypeScript files  
'/App/Resources/Json    -> Output directory for JSON files  


UPDATES:

2017-07-14 add paramater for disable nested resoures.(v 1.0.0)

