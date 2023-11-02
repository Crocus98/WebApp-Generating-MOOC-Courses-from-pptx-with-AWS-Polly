import axios, { AxiosError } from "axios";
import JSZip, { file } from "jszip";
import {
  getSlideNotes,
  sortFilenamesBySlideNumber,
  unzipPowerpoint,
  zipPowerpoint,
} from "./ppt";
import { Buffer } from "buffer";

export const createProject = async (projectName: string, pptx: File) => {
  const fd = new FormData();

  const zipFile = await zipPowerpoint(pptx);

  fd.append("file", zipFile);
  fd.append("projectName", projectName);

  await axios.post("/v1/public/project", {
    projectName,
  });
  await axios.post("/v1/public/upload", fd);
};

export const editProject = async (projectName: string, pptx: File) => {
  const fd = new FormData();
  const zipFile = await zipPowerpoint(pptx);
  fd.append("file", zipFile);
  fd.append("projectName", projectName);

  await axios.post("/v1/public/upload", fd);
};

export const deleteProject = async (projectName: string) => {
  await axios.delete("/v1/public/delete/" + projectName);
};

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
    const pptxBlob = await unzipPowerpoint(downloadRes.data);
    zip = await new JSZip().loadAsync(pptxBlob);
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

  const [slides, audios] = await retrieveSlidesAndPreviews(
    projectName,
    notes.length
  );

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
  const unzippedPPTX = await unzipPowerpoint(downloadRes.data);

  const href = URL.createObjectURL(unzippedPPTX);

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

export const retrieveSlidesAndPreviews = async (
  projectName: string,
  length: number
) => {
  const downloadRes = await Promise.allSettled([
    axios.get("/v1/public/audio/" + projectName, {
      responseType: "blob",
    }),
    axios.get("/v1/public/slides/" + projectName, {
      responseType: "blob",
    }),
  ]);
  console.log(downloadRes);

  let slides = new Array(length).fill(null);

  const imageRes =
    downloadRes[1].status === "fulfilled" ? downloadRes[1] : null;
  if (imageRes) {
    const zip = await JSZip().loadAsync(imageRes.value.data);
    const fileNames = Object.keys(zip.files);
    const slidePreviewsFilenames = sortFilenamesBySlideNumber(
      fileNames.filter((f) => f.includes("slide"))
    );
    slides = await Promise.all(
      slidePreviewsFilenames.map((sf) => readPng64FromZip(sf, zip))
    );
  }

  const audioPreviews = new Array(length).fill(null);
  const audioRes =
    downloadRes[0].status === "fulfilled" ? downloadRes[0] : null;
  if (audioRes) {
    const zipAudio = await JSZip().loadAsync(audioRes.value.data);
    await Promise.all(
      audioPreviews.map((_, i) =>
        fillAudioPreviewAtIndex(audioPreviews, i, zipAudio)
      )
    );
  }
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
