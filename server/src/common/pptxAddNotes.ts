import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import { XMLBuilder, XMLParser } from "fast-xml-parser";
import { v4 as uuidv4 } from "uuid";

export default class PPTXAddNotes {
  private _pptxContainer!: AdmZip;
  private _pathInfo!: path.ParsedPath;

  public static loadFromPath(_path: string) {
    if (!_path.endsWith(".pptx")) throw new Error("Exstension not allowed");
    if (!fs.existsSync(_path)) throw new Error("File not exists");
    var ins = new PPTXAddNotes();
    ins.loadFileFromPath(_path);
    return ins;
  }

  public static loadFromBuffer(buff: Buffer) {
    var ins = new PPTXAddNotes();
    ins.loadFromBuffer(buff);
    return ins;
  }

  public addNote(slideIndex: number, content: string) {
    if (slideIndex < 1) throw new Error("Invalid slide index");
    var fileName = `notesSlide${slideIndex}.xml`;
    var pptPath = "ppt/notesSlides";
    var fullPath = `${pptPath}/${fileName}`;

    var file = this._pptxContainer.getEntry(fullPath);
    if (file === null) throw new Error("Invalid file type or index not found");
    var fileData = file.getData();
    var xmlOpt = {
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
    };
    const parser = new XMLParser(xmlOpt);
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
    spTree = { ...spTree, ...sp };
    nodes["p:spTree"] = spTree;
    xmlData["p:notes"]["p:cSld"] = nodes;

    var builder = new XMLBuilder(xmlOpt);
    const xmlContent = builder.build(xmlData);

    this._pptxContainer.deleteFile(fullPath);
    this._pptxContainer.addFile(fullPath, Buffer.from(xmlContent));
  }

  public getBuffer(): Buffer {
    return this._pptxContainer.toBuffer();
  }

  public getFile(): string {
    var guid = uuidv4();
    var fileName = `${this._pathInfo.name}_${guid}${this._pathInfo.ext}`;
    var newPath = path.resolve(`${this._pathInfo.dir}/${fileName}`);
    var buffer = this.getBuffer();
    var streamWrite = fs.writeFileSync(newPath.toString(), buffer);
    return newPath;
  }

  private loadFileFromPath(_path: string): void {
    var _pathObj = path.parse(_path);
    if (!_pathObj) throw new Error("Invalid path");
    this._pathInfo = _pathObj;
    var buff = fs.readFileSync(_path);
    this.loadFromBuffer(buff);
  }

  private loadFromBuffer(buffer: Buffer): void {
    this._pptxContainer = new AdmZip(buffer);
  }
}
