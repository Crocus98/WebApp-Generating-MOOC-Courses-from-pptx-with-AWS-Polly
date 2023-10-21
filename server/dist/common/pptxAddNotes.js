"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
const path_1 = tslib_1.__importDefault(require("path"));
const adm_zip_1 = tslib_1.__importDefault(require("adm-zip"));
const fast_xml_parser_1 = require("fast-xml-parser");
const uuid_1 = require("uuid");
class PPTXAddNotes {
    static loadFromPath(_path) {
        if (!_path.endsWith(".pptx"))
            throw new Error("Exstension not allowed");
        if (!fs_1.default.existsSync(_path))
            throw new Error("File not exists");
        var ins = new PPTXAddNotes();
        ins.loadFileFromPath(_path);
        return ins;
    }
    static loadFromBuffer(buff) {
        var ins = new PPTXAddNotes();
        ins.loadFromBuffer(buff);
        return ins;
    }
    addNote(slideIndex, content) {
        if (slideIndex < 1)
            throw new Error("Invalid slide index");
        var fileName = `notesSlide${slideIndex}.xml`;
        var pptPath = "ppt/notesSlides";
        var fullPath = `${pptPath}/${fileName}`;
        var file = this._pptxContainer.getEntry(fullPath);
        if (file === null)
            throw new Error("Invalid file type or index not found");
        var fileData = file.getData();
        var xmlOpt = {
            ignoreAttributes: false,
            attributeNamePrefix: "@_",
        };
        const parser = new fast_xml_parser_1.XMLParser(xmlOpt);
        var xmlData = parser.parse(fileData);
        var nodes = xmlData["p:notes"]["p:cSld"];
        var spTree = nodes["p:spTree"];
        var sp = {
            "p:sp": {
                "p:nvSpPr": {
                    "p:cNvPr": { "@_id": "2", "@_name": "" },
                    "p:cNvSpPr": {
                        "a:spLocks": {
                            "@_noGrp": "1",
                        },
                    },
                    "p:nvPr": {
                        "p:ph": { "@_type": "body", "@_idx": "1" },
                    },
                },
                "p:spPr": {},
                "p:txBody": {
                    "a:bodyPr": {},
                    "a:lstStyle": {},
                    "a:p": {
                        "a:r": {
                            "a:t": content,
                        },
                    },
                },
            },
        };
        spTree = Object.assign(Object.assign({}, spTree), sp);
        nodes["p:spTree"] = spTree;
        xmlData["p:notes"]["p:cSld"] = nodes;
        var builder = new fast_xml_parser_1.XMLBuilder(xmlOpt);
        const xmlContent = builder.build(xmlData);
        this._pptxContainer.deleteFile(fullPath);
        this._pptxContainer.addFile(fullPath, Buffer.from(xmlContent));
    }
    getBuffer() {
        return this._pptxContainer.toBuffer();
    }
    getFile() {
        var guid = (0, uuid_1.v4)();
        var fileName = `${this._pathInfo.name}_${guid}${this._pathInfo.ext}`;
        var newPath = path_1.default.resolve(`${this._pathInfo.dir}/${fileName}`);
        var buffer = this.getBuffer();
        var streamWrite = fs_1.default.writeFileSync(newPath.toString(), buffer);
        return newPath;
    }
    loadFileFromPath(_path) {
        var _pathObj = path_1.default.parse(_path);
        if (!_pathObj)
            throw new Error("Invalid path");
        this._pathInfo = _pathObj;
        var buff = fs_1.default.readFileSync(_path);
        this.loadFromBuffer(buff);
    }
    loadFromBuffer(buffer) {
        this._pptxContainer = new adm_zip_1.default(buffer);
    }
}
exports.default = PPTXAddNotes;
