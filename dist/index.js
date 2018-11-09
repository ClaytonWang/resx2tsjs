"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var addTypeScriptFile = require('add-typescript-file-to-project');
var fs = require('fs');
var mkpath = require('mkpath');
var search = require('recursive-search');
var xml2js = require('xml2js');
var virtualProjectRoot = '\\..\\..\\..\\';
function executeResxToTs(typeScriptResourcesNamespace, virtualResxFolder, virtualTypeScriptFolder, isAsslowNest) {
    if (isAsslowNest === void 0) { isAsslowNest = false; }
    var files = getFilesFromFolder(virtualResxFolder, true);
    if (files !== undefined && files !== null) {
        files = removeDuplicatedFiles(files);
        for (var i = 0, length_1 = files.length; i < length_1; i++) {
            var resxFilename = files[i];
            convertResxToTypeScriptModel(resxFilename, typeScriptResourcesNamespace, virtualTypeScriptFolder, isAsslowNest);
        }
    }
}
exports.executeResxToTs = executeResxToTs;
function executeResxToJson(virtualResxFolder, virtualJsonFolder, isAsslowNest, fileNameLanguage) {
    if (isAsslowNest === void 0) { isAsslowNest = false; }
    var files = getFilesFromFolder(virtualResxFolder);
    if (files !== undefined && files !== null) {
        for (var i = 0, length_2 = files.length; i < length_2; i++) {
            var resxFilename = files[i];
            convertResxToJson(resxFilename, virtualJsonFolder, isAsslowNest, fileNameLanguage);
        }
    }
}
exports.executeResxToJson = executeResxToJson;
function removeDuplicatedFiles(files) {
    var tmp = {}, ret = [];
    for (var i = 0, j = files.length; i < j; i++) {
        if (!tmp[files[i]]) {
            tmp[files[i]] = 1;
            ret.push(files[i]);
        }
    }
    return ret;
}
function getFilesFromFolder(virtualResxFolder, uniquFile) {
    if (uniquFile === void 0) { uniquFile = false; }
    var files = null;
    if (virtualResxFolder === undefined || virtualResxFolder === '') {
        files = search.recursiveSearchSync(/.resx$/, __dirname + virtualProjectRoot);
    }
    else {
        virtualResxFolder = virtualResxFolder.replace(/\//g, '\\');
        var safeVirtualFolder = virtualResxFolder;
        if (safeVirtualFolder.charAt(0) === '\\') {
            safeVirtualFolder = safeVirtualFolder.substr(1);
        }
        if (safeVirtualFolder.charAt(safeVirtualFolder.length - 1) === '\\') {
            safeVirtualFolder = safeVirtualFolder.substr(0, safeVirtualFolder.length - 1);
        }
        files = search.recursiveSearchSync(/.resx$/, __dirname + virtualProjectRoot + safeVirtualFolder);
    }
    if (files !== undefined && files !== null) {
        var filesAsString = JSON.stringify(files).replace('[', "").replace(']', "");
        var splittedFiles = filesAsString.split(',');
        var cleanedFiles = splittedFiles.map(function (fileName) {
            if (uniquFile) {
                return fileName.trim().replace(/"/g, "").replace(/\\\\/g, "\\").replace('.en-AU.', '.').replace('.de.', '.');
            }
            else {
                return fileName.trim().replace(/"/g, "").replace(/\\\\/g, "\\");
            }
        });
        return cleanedFiles;
    }
}
function convertResxToTypeScriptModel(resxFilename, typeScriptResourcesNamespace, virtualTypeScriptFolder, isAsslowNest) {
    if (isAsslowNest === void 0) { isAsslowNest = false; }
    fs.readFile(resxFilename, function (err, data) {
        var parser = new xml2js.Parser();
        parser.parseString(data, function (err, result) {
            if (result !== undefined) {
                convertXmlToTypeScriptModelFile(result, resxFilename, typeScriptResourcesNamespace, virtualTypeScriptFolder, isAsslowNest);
            }
        });
    });
}
function convertResxToJson(resxFilename, virtualJsonFolder, isAsslowNest, fileNameLanguage) {
    if (isAsslowNest === void 0) { isAsslowNest = false; }
    fs.readFile(resxFilename, function (err, data) {
        var parser = new xml2js.Parser();
        parser.parseString(data, function (err, result) {
            if (result !== undefined) {
                convertXmlToJsonFile(result, resxFilename, virtualJsonFolder, isAsslowNest, fileNameLanguage);
            }
        });
    });
}
function convertXmlToDictionary(xmlObject, isAsslowNest) {
    if (isAsslowNest === void 0) { isAsslowNest = false; }
    var dictionary = {};
    if (xmlObject.root.data !== undefined) {
        for (var i = 0, nrOfResourcesInFile = xmlObject.root.data.length; i < nrOfResourcesInFile; i++) {
            var key = xmlObject.root.data[i].$.name; //
            var value = xmlObject.root.data[i].value.toString();
            parseToDictionaryItem(key, value, dictionary, isAsslowNest);
        }
    }
    return dictionary;
}
function parseToDictionaryItem(key, value, dictionary, isAsslowNest) {
    if (isAsslowNest === void 0) { isAsslowNest = false; }
    if (!dictionary) {
        dictionary = {};
    }
    if (!key.length) {
        return;
    }
    if (isAsslowNest) {
        var nestedKeyIndex = key.indexOf("_");
        if (nestedKeyIndex >= 0) {
            var firstKey = key.substring(0, nestedKeyIndex);
            var restKey = key.substring(nestedKeyIndex + 1);
            if (!dictionary.hasOwnProperty(firstKey)) {
                dictionary[firstKey] = {};
            }
            parseToDictionaryItem(restKey, value, dictionary[firstKey]);
        }
        else {
            dictionary[key] = value;
        }
    }
    else {
        dictionary[key] = value;
    }
}
function convertDictionaryToTsMapping(dictionary, nest) {
    var nestedTabs = "";
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
            result += childNestedTabs + key + ": " + convertDictionaryToTsMapping(value, nest + 1);
        }
        result += ";\n";
    }
    result += nestedTabs + "}";
    return result;
}
function convertXmlToTypeScriptModelFile(xmlObject, resxFilename, typeScriptResourcesNamespace, virtualTypeScriptFolder, isAsslowNest) {
    if (isAsslowNest === void 0) { isAsslowNest = false; }
    var projectRoot = getProjectRoot();
    var relativeResxFilename = resxFilename.replace(projectRoot, "").replace(/\\/g, "/");
    var className = resxFilename.substr(resxFilename.lastIndexOf("\\") + 1).replace('.resx', '');
    if (className.indexOf(".") != -1) {
        className = className.split(".")[0];
    }
    var content = '// TypeScript Resx model for: ' + relativeResxFilename + '\n' +
        '// Auto generated by resx2tsjs (npm package)' + '\n' + '\n';
    content = content + 'declare module \'' + typeScriptResourcesNamespace + className + '\' {\n';
    content = content + '\texport var ' + className + ': ';
    var dictionary = convertXmlToDictionary(xmlObject, isAsslowNest);
    content = content + convertDictionaryToTsMapping(dictionary, 1);
    content = content + '\n}\n';
    // Write model if resources found
    if (Object.keys(dictionary).length > 0) {
        var tsFileName = resxFilename.replace('.resx', '.d.ts');
        if (virtualTypeScriptFolder === undefined || virtualTypeScriptFolder === '') {
            // Write the file aside of the the resx file.
            fs.writeFileSync(tsFileName, content);
            addTypeScriptFile.execute(tsFileName);
        }
        else {
            // Write the file to the given output folder.
            var tsFileNameWithoutPath = tsFileName.substr(tsFileName.lastIndexOf('\\') + 1);
            var outputFileName = (projectRoot + virtualTypeScriptFolder + '\\' + tsFileNameWithoutPath).split('/').join('\\');
            var relativeOutputFileName = virtualTypeScriptFolder + '/' + tsFileNameWithoutPath;
            mkpath.sync(projectRoot + virtualTypeScriptFolder, '0700');
            fs.writeFileSync(outputFileName, content);
            addTypeScriptFile.execute(relativeOutputFileName);
        }
    }
}
function convertXmlToJsonFile(xmlObject, resxFilename, virtualJsonFolder, isAsslowNest, fileNameLanguage) {
    if (isAsslowNest === void 0) { isAsslowNest = false; }
    var projectRoot = getProjectRoot();
    var className = resxFilename.substr(resxFilename.lastIndexOf("\\") + 1).replace('.resx', '');
    if (className.indexOf(".") != -1) {
        className = className.split(".")[0];
    }
    var dictionary = convertXmlToDictionary(xmlObject, isAsslowNest);
    var content = "{\"" + className + "\" : " + JSON.stringify(dictionary) + "}";
    // Write model if resources found
    if (Object.keys(dictionary).length > 0) {
        var jsonFileName = resxFilename.replace('.resx', '.json');
        if (virtualJsonFolder === undefined || virtualJsonFolder === '') {
            // Write the file aside of the the resx file.
            fs.writeFileSync(jsonFileName, content);
        }
        else {
            // Write the file to the given output folder.
            var jsonFileNameWithoutPath = jsonFileName.substr(jsonFileName.lastIndexOf('\\') + 1);
            if (fileNameLanguage) {
                var fileNameWithoutExtension = jsonFileNameWithoutPath.substring(0, jsonFileNameWithoutPath.indexOf(".json"));
                jsonFileNameWithoutPath = fileNameWithoutExtension + "." + fileNameLanguage + ".json";
            }
            var outputFileName = (projectRoot + virtualJsonFolder + '\\' + jsonFileNameWithoutPath).split('/').join('\\');
            var relativeOutputFileName = virtualJsonFolder + '/' + jsonFileNameWithoutPath;
            mkpath.sync(projectRoot + virtualJsonFolder, '0700');
            fs.writeFileSync(outputFileName, content);
        }
    }
}
function getProjectRoot() {
    var splittedDirName = __dirname.split('\\');
    var splittedRootDirName = [];
    for (var i = 0, length_3 = splittedDirName.length - 3; i < length_3; i++) {
        splittedRootDirName.push(splittedDirName[i]);
    }
    return splittedRootDirName.join('\\');
}
function decapitalizeFirstLetter(input) {
    return input.charAt(0).toLowerCase() + input.slice(1);
}
//# sourceMappingURL=index.js.map