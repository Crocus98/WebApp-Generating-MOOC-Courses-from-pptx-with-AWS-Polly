import axios from "axios";
import JSZip from "jszip";
import { getSlideNotes } from "./ppt";

export const retrieveProject = async (projectName: string) => {
  const downloadRes = await axios.get("/v1/public/download/" + projectName, {
    responseType: "blob",
    params: {
      original: true,
    },
  });

  const zip = await JSZip().loadAsync(downloadRes.data);

  const notes = await getSlideNotes(zip);

  return {
    zip,
    notes,
  };
};

export const elaborateProject = async (projectName: string) => {
  return axios.put("/v1/public/elaborate", { projectName: projectName });
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
