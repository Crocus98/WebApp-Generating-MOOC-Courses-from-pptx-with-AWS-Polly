import { decode, encode } from "html-entities";
import JSZip, { file } from "jszip";
import { toInteger } from "lodash";

const parser = new DOMParser();
const serializer = new XMLSerializer();

const getSlideNumberFromFilename = (str: string, ext: string) =>
  toInteger(str.substring(str.lastIndexOf("lide") + 4, str.indexOf(ext)));

export const sortFilenamesBySlideNumber = (fileNames: string[]) =>
  fileNames.sort(
    (a, b) =>
      getSlideNumberFromFilename(a, ".xml") -
      getSlideNumberFromFilename(b, ".xml")
  );

export const getSlideNotes = async (zip: JSZip): Promise<string[]> => {
  const fileNames = sortFilenamesBySlideNumber(
    Object.keys(zip.files).filter((fn) => fn.includes("notesSlides/notesSlide"))
  );
  const slideCounts = Object.keys(zip.files).filter((fn) =>
    fn.includes("ppt/slides/slide")
  ).length;

  let projectNotes: string[] = new Array(slideCounts).fill("");

  for (const fileName of fileNames) {
    try {
      const xml = await zip.file(fileName)?.async("string");

      if (!xml) throw new Error("No xml content found");

      const slideNotesDoc = parser.parseFromString(xml, "text/xml");

      const txBodies = slideNotesDoc.getElementsByTagName("p:txBody");

      const slideNumberReference = txBodies
        .item(txBodies.length - 1)
        ?.getElementsByTagName("a:t")
        .item(0)?.textContent;

      if (slideNumberReference === null)
        throw new Error("No slide number reference found");
      else if (isNaN(toInteger(slideNumberReference)))
        throw new Error("Invalid slide number reference");

      const slideNumber = toInteger(slideNumberReference);

      const txBody = txBodies.item(0);

      if (!txBody) throw new Error("No txBody found");

      let slideNotes = "";
      const paragraphs = Array.from(txBody.getElementsByTagName("a:p"));

      for (let i = 0; i < paragraphs.length; i++) {
        const p = paragraphs[i];
        slideNotes += Array.from(p.getElementsByTagName("a:t"))
          .map((tag) => tag.textContent)
          .reduce(
            (textTag, currentValue) => decode(textTag) + currentValue,
            ""
          );
        if (i < paragraphs.length - 1) slideNotes += "\n";
      }

      projectNotes[slideNumber - 1] = slideNotes;
    } catch (e) {
      console.log("An error occured while parsing slide notes: ", fileName);
    }
  }
  return projectNotes;
};

export const buildProject = async (
  zip: JSZip,
  notes: string[]
): Promise<Blob> => {
  const fileNames = sortFilenamesBySlideNumber(
    Object.keys(zip.files).filter((fn) => fn.includes("notesSlides/notesSlide"))
  );

  const xml = await zip.file(fileNames[0])?.async("string");
  if (!xml) throw new Error("can't open xml at " + 0);

  for (let i = 0; i < notes.length; i++) {
    const slideNotesDoc = parser.parseFromString(xml, "text/xml");

    const txBodies = slideNotesDoc.getElementsByTagName("p:txBody");

    const slideNumberReference = txBodies
      .item(txBodies.length - 1)
      ?.getElementsByTagName("a:t")
      .item(0);

    if (slideNumberReference == null)
      throw new Error("No slide number reference found");

    slideNumberReference.textContent = `${i + 1}`;

    const txBody = txBodies.item(0);

    if (!txBody) throw new Error("No txBody found");

    //Remove paragraphs
    Array.from(txBody.getElementsByTagName("a:p")).forEach((p) => {
      p.parentNode?.removeChild(p);
    });

    notes[i].split("\n").forEach((line) => {
      const paragraphDoc = parser.parseFromString(
        createParagraph(line),
        "text/xml"
      );
      txBody.appendChild(paragraphDoc.getElementsByTagName("a:p")[0]);
    });

    const serializedSlideNotesXml = serializer.serializeToString(slideNotesDoc);

    await zip.file(
      `ppt/notesSlides/notesSlide${i + 1}.xml`,
      serializedSlideNotesXml
    );
    await zip.file(
      `ppt/notesSlides/_rels/notesSlide${i + 1}.xml.rels`,
      createRelationship(i + 1)
    );
  }

  const contentTypesXml = await zip
    .file("[Content_Types].xml")
    ?.async("string");
  if (contentTypesXml) {
    const contentTypesDoc = parser.parseFromString(contentTypesXml, "text/xml");
    const types = contentTypesDoc.getElementsByTagName("Types")[0];
    if (types == null) throw new Error("No types found");
    const overrideElements = types.getElementsByTagName("Override");
    const elementsList: number[] = [];
    for (let i = 0; i < overrideElements.length; i++) {
      const element = overrideElements.item(i);
      if (element!.getAttribute("PartName")?.includes("notesSlides")) {
        const partName = element!.getAttribute("PartName")!;

        elementsList.push(
          toInteger(
            partName.substring(
              partName.lastIndexOf("notesSlide") + 10,
              partName.indexOf(".xml")
            )
          )
        );
      }
    }
    if (elementsList.length !== notes.length) {
      for (let i = 0; i < notes.length; i++) {
        if (!elementsList.includes(i + 1)) {
          const contentTypePart = parser.parseFromString(
            createContentTypePart(i + 1),
            "text/xml"
          );
          types.appendChild(
            contentTypePart.getElementsByTagName("Override")[0]
          );
        }
      }
    }
    const serializedContentTypesXml =
      serializer.serializeToString(contentTypesDoc);
    await zip.file("[Content_Types].xml", serializedContentTypesXml);
  }
  return await zip.generateAsync({ type: "blob" });
};

const createParagraph = (text: string) =>
  `<?xml version="1.0" encoding="UTF-8"?>
  <p:notes xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
     <a:p>
        <a:pPr marL="0" marR="0" lvl="0" indent="0" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" fontAlgn="auto" latinLnBrk="0" hangingPunct="1">
           <a:lnSpc>
              <a:spcPct val="100000" />
           </a:lnSpc>
           <a:spcBef>
              <a:spcPts val="0" />
           </a:spcBef>
           <a:spcAft>
              <a:spcPts val="0" />
           </a:spcAft>
           <a:buClrTx />
           <a:buSzTx />
           <a:buFontTx />
           <a:buNone />
           <a:tabLst />
           <a:defRPr />
        </a:pPr>
        <a:r>
           <a:rPr lang="en-US" noProof="0" dirty="0" />
           <a:t>${encode(text)}</a:t>
        </a:r>
     </a:p>
  </p:notes>`;

const createRelationship = (
  slideNumber: number
) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId2"
        Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide"
        Target="../slides/slide${slideNumber}.xml" />
    <Relationship Id="rId1"
        Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesMaster"
        Target="../notesMasters/notesMaster1.xml" />
</Relationships>`;

const createContentTypePart = (
  slideNumber: number
) => `<Override PartName="/ppt/notesSlides/notesSlide${slideNumber}.xml"
ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml" />`;

export const zipPowerpoint = async (file: File) => {
  const fileNameWithoutExtension = file.name.substring(
    0,
    file.name.lastIndexOf(".")
  );
  const zip = new JSZip();
  await zip.file(file.name, file);
  const zipBlob = await zip.generateAsync({ type: "blob" });
  const zipFile = new File([zipBlob], `${fileNameWithoutExtension}.zip`, {
    type: "application/zip",
  });
  return zipFile;
};

export const unzipPowerpoint = async (data: ArrayBuffer) => {
  const containerZip = await JSZip().loadAsync(data);
  const fileName = Object.keys(containerZip.files)[0];
  if (!fileName) throw new Error("No zip file found inside zip");
  const blob = await containerZip.file(fileName)?.async("blob");
  if (!blob) throw new Error("Can't read zip file inside zip");
  return blob;
};

export const isPPTXValid = async (file: File): Promise<string | boolean> => {
  const zip = new JSZip().loadAsync(file);

  const notesLength = Object.keys((await zip).files).filter((fn) =>
    fn.includes("notesSlides/notesSlide")
  ).length;
  const slideLength = Object.keys((await zip).files).filter((fn) =>
    fn.includes("slides/slide")
  ).length;

  if (slideLength === 0) {
    return "No slide found in the powerpoint";
  }
  if (slideLength > 100) {
    return "Too many slides in the powerpoint. Please use a powerpoint with less than 100 slides";
  }

  if (notesLength !== slideLength) {
    return "Some slides are missing notes. Please add notes to all slides";
  }

  return false;
};
