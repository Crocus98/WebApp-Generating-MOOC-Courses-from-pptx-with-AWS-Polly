import React, { useEffect, useState } from "react";
import styled from "styled-components";
import colors from "../style/colors";
import Header from "../components/Header";
import { useNavigate, useParams } from "react-router-dom";
import axios, { AxiosError } from "axios";
import JSZip from "jszip";
import EditorSideBar from "../components/EditorSideBar";
import SlideEditor from "../components/SlideEditor";
import {
  downloadProject,
  elaborateProject,
  retrieveProject,
} from "../services/project";
import { buildProject } from "../services/ppt";

interface Props {}

enum Voices {
  MICHEAL = "micheal",
  LAURA = "laura",
  GIUSEPPE = "giuseppe",
  MARIA = "maria",
}

export default function Editor({}: Props) {
  const { projectName } = useParams();
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState(false);
  const [notes, setNotes] = useState<string[]>([]);
  const [slideFocus, setSlideFocus] = useState(0);
  const [projectZip, setProjectZip] = useState<JSZip | null>(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);

  useEffect(() => {
    async function getProject() {
      if (projectName) {
        try {
          const { notes, zip } = await retrieveProject(projectName);
          setNotes(notes);
          setProjectZip(zip);
        } catch (error) {
          console.log(error);
          if (error instanceof AxiosError) {
            if (error.response?.status === 404) {
              navigate("/projectnotfound");
            }
          }
        }
      } else {
        navigate("/projectnotfound");
      }
    }
    getProject();
  }, []);

  const getSlideOnChange = (index: number) => (content: string) => {
    setNotes((notes) => [
      ...notes.slice(0, index),
      content,
      ...notes.slice(index + 1),
    ]);
    setUnsavedChanges(true);
  };

  const processAndDownload = async () => {
    try {
      if (projectName) {
        setDownloading(true);
        await elaborateProject(projectName);
        await downloadProject(projectName);
      }
    } catch (error) {
      console.log(error);
    }
    setDownloading(false);
  };

  const saveProject = async () => {
    setLoadingSave(true);
    try {
      if (projectName && projectZip) {
        const updatedProjectBlob = await buildProject(projectZip, notes);
        const file = new File(
          [updatedProjectBlob],
          `${encodeURI(projectName)}.pptx`
        );

        /*
        const fd = new FormData();
        fd.append("file", file);
        fd.append("projectName", projectName);
        await axios.post("/v1/public/upload", fd);
        */

        

        setUnsavedChanges(false);
      }
    } catch (error) {
      console.log(error);
    }
    setLoadingSave(false);
  };

  return (
    <Container>
      <Header
        projectName={projectName}
        onDownload={processAndDownload}
        loadingDownload={downloading}
        onSave={saveProject}
        loadingSave={loadingSave}
        disabeledSave={!unsavedChanges}
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
