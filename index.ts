declare const __dirname: string;
declare const require: any;

const addTypeScriptFile = require('add-typescript-file-to-project');
const fs = require('fs');
const mkpath = require('mkpath');
const search = require('recursive-search');
const xml2js = require('xml2js');

const virtualProjectRoot = '\\..\\..\\..\\';

interface Dictionary {
    [key: string]: string | Dictionary;
}

export function executeResxToTs(typeScriptResourcesNamespace: string, virtualResxFolder: string, virtualTypeScriptFolder: string, isAsslowNest: boolean = false): void {
    let files = getFilesFromFolder(virtualResxFolder,true);

    if (files !== undefined && files !== null) {
      files = removeDuplicatedFiles(files);
        for (let i = 0, length = files.length; i < length; i++) {
            const resxFilename = files[i];
            convertResxToTypeScriptModel(resxFilename, typeScriptResourcesNamespace, virtualTypeScriptFolder, isAsslowNest);
        }
    }
}

export function executeResxToJson(virtualResxFolder: string, virtualJsonFolder: string, isAsslowNest: boolean = false, fileNameLanguage?: string): void {
    let files = getFilesFromFolder(virtualResxFolder);

    if (files !== undefined && files !== null) {
        for (let i = 0, length = files.length; i < length; i++) {
            const resxFilename = files[i];
            convertResxToJson(resxFilename, virtualJsonFolder, isAsslowNest, fileNameLanguage);
        }
    }
}

function removeDuplicatedFiles(files){
  var tmp = {},
      ret = [];
    for (var i = 0, j = files.length; i < j; i++) {
          if (!tmp[files[i]]) {
              tmp[files[i]] = 1;
              ret.push(files[i]);
          }
      }
    return ret;
}

function getFilesFromFolder(virtualResxFolder: string,uniquFile:boolean = false): any {
    let files: any = null;

    if (virtualResxFolder === undefined || virtualResxFolder === '') {
        files = search.recursiveSearchSync(/.resx$/, __dirname + virtualProjectRoot);
    }
    else {
        virtualResxFolder = virtualResxFolder.replace(/\//g, '\\');

        let safeVirtualFolder = virtualResxFolder;

        if (safeVirtualFolder.charAt(0) === '\\') {
            safeVirtualFolder = safeVirtualFolder.substr(1);
        }
        if (safeVirtualFolder.charAt(safeVirtualFolder.length - 1) === '\\') {
            safeVirtualFolder = safeVirtualFolder.substr(0, safeVirtualFolder.length - 1);
        }

        files = search.recursiveSearchSync(/.resx$/, __dirname + virtualProjectRoot + safeVirtualFolder);
    }

    if (files !== undefined && files !== null) {
        const filesAsString = JSON.stringify(files).replace('[', "").replace(']', "");
        const splittedFiles = filesAsString.split(',');
        let cleanedFiles = splittedFiles.map((fileName) => {
          if(uniquFile){
            return fileName.trim().replace(/"/g, "").replace(/\\\\/g, "\\").replace('.en-AU.','.').replace('.de.','.');
          }else{
            return fileName.trim().replace(/"/g, "").replace(/\\\\/g, "\\");
          }
        });
        return cleanedFiles;
    }
}

function convertResxToTypeScriptModel(resxFilename: string, typeScriptResourcesNamespace: string, virtualTypeScriptFolder: string, isAsslowNest: boolean = false): void {
    fs.readFile(resxFilename, function (err: any, data: any) {
        const parser = new xml2js.Parser();

        parser.parseString(data, function (err: any, result: any) {
            if (result !== undefined) {
                convertXmlToTypeScriptModelFile(result, resxFilename, typeScriptResourcesNamespace, virtualTypeScriptFolder, isAsslowNest);
            }
        });
    });
}

function convertResxToJson(resxFilename: string, virtualJsonFolder: string, isAsslowNest: boolean = false, fileNameLanguage?: string): void {
    fs.readFile(resxFilename, function (err: any, data: any) {
        const parser = new xml2js.Parser();

        parser.parseString(data, function (err: any, result: any) {
            if (result !== undefined) {
                convertXmlToJsonFile(result, resxFilename, virtualJsonFolder, isAsslowNest, fileNameLanguage);
            }
        });
    });
}

function convertXmlToDictionary(xmlObject: any, isAsslowNest: boolean = false) {
    let dictionary: Dictionary = {};

    if (xmlObject.root.data !== undefined) {
        for (let i = 0, nrOfResourcesInFile = xmlObject.root.data.length; i < nrOfResourcesInFile; i++) {
            const key = xmlObject.root.data[i].$.name; //
            const value = xmlObject.root.data[i].value.toString();

            parseToDictionaryItem(key, value, dictionary, isAsslowNest);
        }
    }

    return dictionary;
}

function parseToDictionaryItem(key: string, value: string, dictionary: Dictionary, isAsslowNest: boolean = false) {
    if (!dictionary) {
        dictionary = {};
    }

    if (!key.length) {
        return;
    }

    if (isAsslowNest) {
        let nestedKeyIndex = key.indexOf("_");

        if (nestedKeyIndex >= 0) {
            let firstKey = key.substring(0, nestedKeyIndex);
            let restKey = key.substring(nestedKeyIndex + 1);

            if (!dictionary.hasOwnProperty(firstKey)) {
                dictionary[firstKey] = <Dictionary>{};
            }

            parseToDictionaryItem(restKey, value, <Dictionary>dictionary[firstKey])
        } else {
            dictionary[key] = value;
        }
    } else {
        dictionary[key] = value;
    }
}

function convertDictionaryToTsMapping(dictionary: Dictionary, nest: number) {
    let nestedTabs = "";
    for (var i = 0; i < nest; i++) {
        nestedTabs += "\t";
    }

    var childNestedTabs = nestedTabs + "\t";
    var result = "{\n";

    var keys = Object.keys(dictionary);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var value = dictionary[key];
        if (typeof value == "string") {
            result += childNestedTabs + key + ": string";
        }
        else if (typeof value == "object") {
            result += childNestedTabs + key + ": " + convertDictionaryToTsMapping(<Dictionary>value, nest + 1);
        }
        result += ";\n";
    }

    result += nestedTabs + "}";

    return result;
}

function convertXmlToTypeScriptModelFile(xmlObject: any, resxFilename: string, typeScriptResourcesNamespace: string, virtualTypeScriptFolder: string, isAsslowNest: boolean = false): void {
    const projectRoot = getProjectRoot();
    const relativeResxFilename = resxFilename.replace(projectRoot, "").replace(/\\/g, "/");
    let className = resxFilename.substr(resxFilename.lastIndexOf("\\") + 1).replace('.resx', '');
    if (className.indexOf(".") != -1) {
        className = className.split(".")[0];
    }

    let content = '// TypeScript Resx model for: ' + relativeResxFilename + '\n' +
        '// Auto generated by resx2tsjs (npm package)' + '\n' + '\n';

    content = content + 'declare module \'' + typeScriptResourcesNamespace + className + '\' {\n';
    content = content + '\texport var ' + className + ': ';

    let dictionary = convertXmlToDictionary(xmlObject, isAsslowNest);
    content = content + convertDictionaryToTsMapping(dictionary, 1);
    content = content + '\n}\n';

    // Write model if resources found
    if (Object.keys(dictionary).length > 0) {
        const tsFileName = resxFilename.replace('.resx', '.d.ts');

        if (virtualTypeScriptFolder === undefined || virtualTypeScriptFolder === '') {
            // Write the file aside of the the resx file.
            fs.writeFile(tsFileName, content, null);

            addTypeScriptFile.execute(tsFileName);
        }
        else {
            // Write the file to the given output folder.
            const tsFileNameWithoutPath = tsFileName.substr(tsFileName.lastIndexOf('\\') + 1);
            const outputFileName = (projectRoot + virtualTypeScriptFolder + '\\' + tsFileNameWithoutPath).split('/').join('\\');
            const relativeOutputFileName = virtualTypeScriptFolder + '/' + tsFileNameWithoutPath;

            mkpath.sync(projectRoot + virtualTypeScriptFolder, '0700');

            fs.writeFile(outputFileName, content, null);

            addTypeScriptFile.execute(relativeOutputFileName);
        }
    }
}

function convertXmlToJsonFile(xmlObject: any, resxFilename: string, virtualJsonFolder: string, isAsslowNest: boolean = false, fileNameLanguage?: string): void {
    const projectRoot = getProjectRoot();
    let className = resxFilename.substr(resxFilename.lastIndexOf("\\") + 1).replace('.resx', '');
    if (className.indexOf(".") != -1) {
        className = className.split(".")[0];
    }
    let dictionary = convertXmlToDictionary(xmlObject, isAsslowNest);
    let content = "{\"" + className + "\" : " + JSON.stringify(dictionary) + "}";

    // Write model if resources found
    if (Object.keys(dictionary).length > 0) {
        const jsonFileName = resxFilename.replace('.resx', '.json');

        if (virtualJsonFolder === undefined || virtualJsonFolder === '') {
            // Write the file aside of the the resx file.
            fs.writeFile(jsonFileName, content, null);
        }
        else {
            // Write the file to the given output folder.
            let jsonFileNameWithoutPath = jsonFileName.substr(jsonFileName.lastIndexOf('\\') + 1);
            if (fileNameLanguage) {
                let fileNameWithoutExtension = jsonFileNameWithoutPath.substring(0, jsonFileNameWithoutPath.indexOf(".json"))
                jsonFileNameWithoutPath = `${fileNameWithoutExtension}.${fileNameLanguage}.json`;
            }

            const outputFileName = (projectRoot + virtualJsonFolder + '\\' + jsonFileNameWithoutPath).split('/').join('\\');
            const relativeOutputFileName = virtualJsonFolder + '/' + jsonFileNameWithoutPath;

            mkpath.sync(projectRoot + virtualJsonFolder, '0700');

            fs.writeFile(outputFileName, content, null);
        }
    }
}

function getProjectRoot(): string {
    const splittedDirName = __dirname.split('\\');
    const splittedRootDirName: Array<string> = [];

    for (let i = 0, length = splittedDirName.length - 3; i < length; i++) {
        splittedRootDirName.push(splittedDirName[i]);
    }

    return splittedRootDirName.join('\\');
}

function decapitalizeFirstLetter(input: string) {
    return input.charAt(0).toLowerCase() + input.slice(1);
}
