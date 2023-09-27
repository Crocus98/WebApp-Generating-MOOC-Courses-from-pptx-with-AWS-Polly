import axios, { AxiosError } from "axios";
import JSZip from "jszip";
import { getSlideNotes, sortFilenamesBySlideNumber } from "./ppt";
import { Buffer } from "buffer";

export const retrieveProject = async (
  projectName?: string
): Promise<{
  audios: string[];
  notes: string[];
  slides: string[];
  projectZip: JSZip;
}> => {
  if (!projectName) throw new Error("Project name not defined");

  let zip: JSZip;

  try {
    const downloadRes = await axios.get("/v1/public/download/" + projectName, {
      responseType: "arraybuffer",
      params: {
        original: true,
      },
    });
    zip = await JSZip().loadAsync(downloadRes.data);
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.response?.status === 404) {
        throw new Error("Project not found");
      }
      if (error.response?.data) {
        const data = Buffer.from(error.response.data, "binary").toString(
          "utf-8"
        );
        throw new Error(JSON.stringify(data));
      }
    }
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Unknow error in retrieveProject");
  }

  const notes = await getSlideNotes(zip);

  const [slides, audios] = await retrieveSlidesAndPreviews(projectName);

  return { audios, notes, slides, projectZip: zip };
};

export const elaborateProject = async (projectName: string) => {
  return axios.post("/v1/public/elaborate", { projectName: projectName });
};

export const downloadProject = async (projectName: string) => {
  const downloadRes = await axios.get("/v1/public/download/" + projectName, {
    responseType: "blob",
  });
  // create file link in browser's memory
  const href = URL.createObjectURL(downloadRes.data);

  // create "a" HTML element with href to file & click
  const link = document.createElement("a");
  link.href = href;
  link.setAttribute("download", projectName + ".pptx"); //or any other extension
  document.body.appendChild(link);
  link.click();

  // clean up "a" element & remove ObjectURL
  document.body.removeChild(link);
  URL.revokeObjectURL(href);
};

export const retrieveSlidesAndPreviews = async (projectName: string) => {
  const downloadRes = await axios.get("/v1/public/slides/" + projectName, {
    responseType: "blob",
  });
  const zip = await JSZip().loadAsync(downloadRes.data);
  const fileNames = Object.keys(zip.files);
  const slidePreviewsFilenames = sortFilenamesBySlideNumber(
    fileNames.filter((f) => f.includes("slide"))
  );
  const slides = await Promise.all(
    slidePreviewsFilenames.map((sf) => readPng64FromZip(sf, zip))
  );

  const audioPreviews = new Array(slides.length).fill(null);
  await Promise.all(
    audioPreviews.map((_, i) => fillAudioPreviewAtIndex(audioPreviews, i, zip))
  );
  return [slides, audioPreviews];
};

const fillAudioPreviewAtIndex = async (
  audioPreviews: (string | null)[],
  i: number,
  zip: JSZip
) => {
  const audio = await zip.file(`audio_${i}.mp3`)?.async("base64");
  if (audio) {
    audioPreviews[i] = "data:audio/mp3;base64," + audio;
  } else {
    audioPreviews[i] = null;
  }
};

const readPng64FromZip = async (
  filename: string,
  zip: JSZip
): Promise<string> => {
  return "data:image/png;base64," + (await zip.file(filename)?.async("base64"));
};

export const retrievePreview = async (text: string) => {
  try {
    const downloadRes = await axios.post(
      "/v1/public/preview",
      { text },
      { responseType: "arraybuffer" }
    );
    const previewBase64 =
      "data:audio/mp3;base64," +
      Buffer.from(downloadRes.data, "binary").toString("base64");
    return previewBase64;
  } catch (error) {
    if (error instanceof AxiosError) {
      const message = Buffer.from(error.response?.data, "binary").toString(
        "utf-8"
      );
      throw new Error(message);
    }
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Unknow error in Preview");
  }
};
