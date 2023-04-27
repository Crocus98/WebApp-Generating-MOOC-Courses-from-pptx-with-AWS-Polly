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

type Props = {};

export default function Generator({}: Props) {
  const [dropping, setDropping] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await axios.post("/v1/public/upload", fd);
      console.log(res);
    } catch (error) {
      console.log(error);
    }
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

  const selectFile = async () => {
    inputRef.current?.click();
  };

  const onDropFile = async (evt: React.DragEvent<HTMLDivElement>) => {
    evt.preventDefault();
    const files = await fromEvent(evt);
  };

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
          ref={inputRef}
          accept=".pptx"
        />
        <FontAwesomeIcon
          icon={"file-upload"}
          size={"3x"}
          color={colors.darkGrey}
        />
        <GeneratorText>
          {!file
            ? "Drop any .pptx file in the rectangle below to generate the MOOC content or"
            : file.name}
        </GeneratorText>
        <Button onClick={selectFile}>Seleziona .pptx</Button>
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
