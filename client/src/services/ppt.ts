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
  console.log(fileNames);

  let projectNotes: string[] = [];

  for (const fileName of fileNames) {
    try {
      const xml = await zip.file(fileName)?.async("string");
      if (!xml) throw new Error("No xml content found");

      const slideNotesDoc = parser.parseFromString(xml, "text/xml");

      const txBody = slideNotesDoc.getElementsByTagName("p:txBody").item(0);

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
        //console.log(slideNotes);
        if (i < paragraphs.length - 1) slideNotes += "\n";
      }

      projectNotes.push(slideNotes);
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

  if (fileNames.length !== notes.length) throw new Error("Invalid notes array");

  for (let i = 0; i < fileNames.length; i++) {
    const xml = await zip.file(fileNames[i])?.async("string");

    if (!xml) throw new Error("can't open xml at " + fileNames[i]);
    // Extract slide notes from xml using <a:t> tags

    const slideNotesDoc = parser.parseFromString(xml, "text/xml");

    const txBody = slideNotesDoc.getElementsByTagName("p:txBody").item(0);

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

    await zip.file(fileNames[i], serializedSlideNotesXml);
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
  console.log(Object.keys(containerZip.files));
  const fileName = Object.keys(containerZip.files)[0];
  console.log(fileName);
  if (!fileName) throw new Error("No zip file found inside zip");
  const blob = await containerZip.file(fileName)?.async("blob");
  if (!blob) throw new Error("Can't read zip file inside zip");
  return blob;
};
