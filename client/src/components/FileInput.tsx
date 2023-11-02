import React, { ChangeEvent, useRef, useState } from "react";
import styled from "styled-components";
import colors from "../style/colors";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Button from "./Button";
import LoadingWidget from "./LoadingWidget";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  file: File | null;
  setFile: (file: File | null) => void;
  loading?: boolean;
}

export default function FileInput({ loading, file, setFile, ...rest }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFile(file);
    }
  };

  const selectFile = () => {
    console.log(inputRef.current);
    inputRef.current?.click();
  };
  <div></div>;
  return (
    <GeneratorContainer style={{ marginTop: 30 }} {...rest}>
      <InvisibleInput
        type="file"
        onChange={handleFileChange}
        onChangeCapture={console.log}
        ref={inputRef}
        accept=".pptx"
      />
      {loading ? (
        <>
          <LoadingWidget size="3x" />
          <GeneratorText>
            This may take a few minutes if your presentation is large. DON'T
            LEAVE THIS PAGE.
          </GeneratorText>
        </>
      ) : !!file ? (
        <>
          <FontAwesomeIcon
            icon={"cloud-arrow-down"}
            size={"3x"}
            color={colors.purple}
          />
          <GeneratorText>{file.name}</GeneratorText>
          <Button type="button" onClick={selectFile}>
            Modifica
          </Button>
        </>
      ) : (
        <>
          <FontAwesomeIcon
            icon={"file-upload"}
            size={"3x"}
            color={colors.darkGrey}
          />
          <GeneratorText>Insert your .pptx file</GeneratorText>
          <Button type="button" onClick={selectFile}>
            Select .pptx
          </Button>
        </>
      )}
    </GeneratorContainer>
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
