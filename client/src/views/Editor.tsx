import React, { useEffect, useState } from "react";
import styled from "styled-components";
import colors from "../style/colors";
import Header from "../components/Header";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import JSZip from "jszip";
import EditorSideBar from "../components/EditorSideBar";
import SlideEditor from "../components/SlideEditor";
import { decode } from "html-entities";

interface Props {}

export default function Editor({}: Props) {
  const { projectName } = useParams();
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState(false);
  const [notes, setNotes] = useState<string[]>([]);
  const [slideFocus, setSlideFocus] = useState(0);

  const getSlideOnChange = (index: number) => (content: string) =>
    setNotes((notes) => [
      ...notes.slice(0, index),
      content,
      ...notes.slice(index + 1),
    ]);

  useEffect(() => {
    async function getProject() {
      if (projectName) {
        console.log(`Project name: ${projectName}`);
        const downloadRes = await axios.get(
          "/v1/public/download/" + projectName,
          {
            responseType: "blob",
            params: {
              original: true,
            },
          }
        );

        const zip = await JSZip().loadAsync(downloadRes.data);

        const fileNames = Object.keys(zip.files).filter((fn) =>
          fn.includes("notesSlides/notesSlide")
        );
        let projectNotes: string[] = [];

        for (const fileName of fileNames) {
          try {
            const xml = await zip.file(fileName)?.async("string");
            if (!xml) return;
            // Extract slide notes from xml using <a:t> tags
            let openTextTag = xml.indexOf("<a:t>");
            let closeTextTag = 0;
            let endTextTag = xml.indexOf("</p:txBody>");
            let text = "";
            while (openTextTag < endTextTag && openTextTag !== -1) {
              closeTextTag = xml.indexOf("</a:t>", openTextTag);
              text += decode(xml.slice(openTextTag + 5, closeTextTag));
              openTextTag = xml.indexOf("<a:t>", closeTextTag);
            }
            projectNotes.push(text);
          } catch (e) {
            console.log(e);
            return;
          }
        }

        setNotes(projectNotes);

        /*
        await Promise.all(
          Object.keys(zip.files).map(async (relativePath) => {
            const file = zip.file(relativePath);
            const ext = relativePath.split(".").pop();
            console.log(ext);
            let content;
            if (!file || file.dir) {
              return;
            } else if (ext === "xml" || ext === "rels") {
              const xml = await file.async("binarystring");
              content = await xml2js.parseStringPromise(xml);
            } else {
              // Handles media assets (image, audio, video, etc.)
              content = await file.async("arraybuffer");
            }

            json[relativePath] = content;
          })
        );

        const xml = await zip.file(fileNames[1])?.async("string");

        console.log(fileNames);

        
        files.forEach(function (file) {
          // Do whatever you want to do with the file
          try {
            if (file.includes("notesSlide")) {
              name = file.toString();
              temp_path = folderPath + file;

              let xmlContent = require("fs").readFileSync(temp_path, "utf8");

              // Extract slide notes from xml using <a:t> tags
              let openTextTag = xmlContent.indexOf("<a:t>");
              let closeTextTag = 0;
              let endTextTag = xmlContent.indexOf("</p:txBody>");
              let text = "";
              while (openTextTag < endTextTag && openTextTag != -1) {
                closeTextTag = xmlContent.indexOf("</a:t>", openTextTag);
                text += entities.decode(
                  xmlContent.slice(openTextTag + 5, closeTextTag)
                );
                openTextTag = xmlContent.indexOf("<a:t>", closeTextTag);
              }
              // Add <speak> tag for Polly
              text = "<speak>" + text + "</speak>";

              let slide_number = file.match(/\d+/).toString();
              texts.push([slide_number, text]);
            }
          } catch (e) {
            // console.log(temp_path, e.message);
            return;
          }
        });
        */
      } else {
        navigate("/projectnotfound");
      }
    }
    getProject();
  }, []);

  const downloadProject = async () => {
    try {
      setDownloading(true);
      await axios.put("/v1/public/elaborate", { projectName: projectName });
      const downloadRes = await axios.get(
        "/v1/public/download/" + projectName,
        {
          responseType: "blob",
        }
      );
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
    } catch (error) {
      console.log(error);
    }
    setDownloading(false);
  };

  return (
    <Container>
      <Header
        projectName={projectName}
        onDownload={downloadProject}
        loadingDownload={downloading}
      />
      {notes.length > 0 && (
        <EditorContainer>
          <EditorSideBar
            nSlides={notes.length}
            focus={slideFocus}
            onFocus={(i) => setSlideFocus(i)}
          />
          <SlideEditor
            slideNumber={slideFocus + 1}
            lastSlideNumber={notes.length}
            goNextSlide={() =>
              setSlideFocus((v) => Math.min(v + 1, notes.length - 1))
            }
            goPreviousSlide={() => setSlideFocus((v) => Math.max(v - 1, 0))}
            content={notes[slideFocus]}
            onChange={getSlideOnChange(slideFocus)}
          />
        </EditorContainer>
      )}
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
`;

const EditorContainer = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: 1fr;
  flex: 1;
  overflow: hidden;
`;
