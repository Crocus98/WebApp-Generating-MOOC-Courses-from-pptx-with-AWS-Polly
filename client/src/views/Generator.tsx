import React, { ChangeEvent, useRef, useState } from "react";
import styled from "styled-components";
import * as Text from "../components/Text";
import Button from "../components/Button";
import MainContentContainer from "../components/MainContentContainer";
import colors from "../style/colors";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { fromEvent } from "file-selector";
import classNames from "classnames";
import axios from "axios";
import { set } from "lodash";

type Props = {};

export default function Generator({}: Props) {
  const [dropping, setDropping] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const uploadFile = async (file: File) => {
    setLoading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("projectName", "default");

    try {
      const res = await axios.post("/v1/public/upload", fd);
      console.log(res);
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFile(file);
      uploadFile(file);
    }
  };

  const onDragEnter = (evt: React.DragEvent<HTMLDivElement>) => {
    evt.preventDefault();
    setDropping(true);
  };

  const onDragOver = (evt: React.DragEvent<HTMLDivElement>) => {
    evt.preventDefault();
  };

  const onDragLeave = (evt: React.DragEvent<HTMLDivElement>) => {
    evt.preventDefault();
    setDropping(false);
  };

  const selectFile = () => {
    console.log(inputRef.current);
    inputRef.current?.click();
  };

  const onDropFile = async (evt: React.DragEvent<HTMLDivElement>) => {
    evt.preventDefault();
    const files = await fromEvent(evt);
  };

  const downloadFile = async () => {
    try {
      setLoading(true);
      // await axios.post("/v1/public/elaborate", {
      //   projectName: "default",
      // });
      const downloadRes = await axios.get("/v1/public/download/default", {
        responseType: "blob",
      });
      const headerval = downloadRes.headers["content-disposition"];
      const filename = decodeURI(headerval.split("filename=")[1]);
      const url = window.URL.createObjectURL(new Blob([downloadRes.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      link.remove();
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  /*
  No File
  Loading
  File
  Downloading
  */

  return (
    <MainContentContainer>
      <Text.H2>MOOC Generator</Text.H2>
      <Text.P>
        Drop any .pptx file in the rectangle below to generate the MOOC content
      </Text.P>
      <GeneratorContainer
        style={{ marginTop: 30 }}
        onDragEnter={onDragEnter}
        onDrop={onDropFile}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        className={classNames(dropping && "dropping")}
      >
        <InvisibleInput
          type="file"
          onChange={handleFileChange}
          onChangeCapture={console.log}
          ref={inputRef}
          accept=".pptx"
        />
        {
          /*loading ? (
          <GeneratorText>Loading...</GeneratorText>
        ) : !!file ? (
          <>
            <FontAwesomeIcon
              icon={"cloud-arrow-down"}
              size={"3x"}
              color={colors.purple}
            />
            <GeneratorText>{file.name}</GeneratorText>
            <Button onClick={selectFile}>Download</Button>
          </>
        ) : (
          <>
            <FontAwesomeIcon
              icon={"file-upload"}
              size={"3x"}
              color={colors.darkGrey}
            />
            <GeneratorText>
              Drop any .pptx file in the rectangle below to generate the MOOC
              content or
            </GeneratorText>
            <Button onClick={selectFile}>Seleziona .pptx</Button>
          </>
        )*/
          <>
            <FontAwesomeIcon
              icon={"cloud-arrow-down"}
              size={"3x"}
              color={colors.purple}
            />
            <Button onClick={downloadFile}>Download</Button>
          </>
        }
      </GeneratorContainer>
    </MainContentContainer>
  );
}

const InvisibleInput = styled.input`
  display: none;
`;

const GeneratorContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  justify-content: center;
  align-items: center;
  max-width: 700px;
  max-height: 500px;
  width: calc(100% - 40px);
  height: 50vh;
  background-color: ${colors.lightGrey};
  border: dashed 1px ${colors.darkGrey};
  border-radius: 6px;

  &.dropping {
    border: solid 1px ${colors.darkGrey};
  }
`;

const GeneratorText = styled.p`
  color: ${colors.darkGrey};
  font-size: 14px;
  text-align: center;
  vertical-align: middle;
  max-width: 150px;
  margin: 0;
`;
