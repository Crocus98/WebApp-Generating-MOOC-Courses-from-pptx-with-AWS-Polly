import React from "react";
import styled from "styled-components";
import colors from "../style/colors";
import Player from "./Player";
import { AudioPreviewType } from "../views/Editor";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type Props = {
  audio: AudioPreviewType;
  onGeneratePreview: () => void;
  isPreviewOutdated: boolean;
};

export default function VoicePreviewBar({
  audio,
  onGeneratePreview,
  isPreviewOutdated,
}: Props) {
  return (
    <VoicePreviewContainer>
      <GeneratePreviewButton
        onClick={onGeneratePreview}
        disabled={audio.isProcessing}
      >
        <FontAwesomeIcon icon={"bolt"} size="1x" />
        <span>GENERA PREVIEW</span>
      </GeneratePreviewButton>
      <PlayerContainer>
        {audio.data && <Player audio={audio.data} loading={false} />}
      </PlayerContainer>
      {audio.data == null ? (
        <InfoContainer>
          <span>PREVIEW NOT FOUND</span>
          <FontAwesomeIcon icon={"triangle-exclamation"} size="1x" />
        </InfoContainer>
      ) : isPreviewOutdated ? (
        <InfoContainer>
          <span>OUTDATED PREVIEW</span>
          <FontAwesomeIcon icon={"triangle-exclamation"} size="1x" />
        </InfoContainer>
      ) : (
        <InfoContainer />
      )}
    </VoicePreviewContainer>
  );
}

const VoicePreviewContainer = styled.div`
  background-color: ${colors.green};
  height: 40px;
  width: 100%;
  display: flex;
  flex-direction: row;
  font-size: 13px;
  justify-content: space-between;
`;

const GeneratePreviewButton = styled.button`
  background-color: ${colors.orange};
  color: ${colors.white};
  height: 40px;
  display: flex;
  flex-direction: row;
  gap: 10px;
  border: none;
  align-items: center;
  justify-content: center;
  width: 200px;
  font-size: 13px;
  cursor: pointer;

  &:hover {
    background-color: ${colors.darkPurple};
  }

  &:disabled {
    background-color: ${colors.darkGrey};
    cursor: not-allowed;
  }
`;

const PlayerContainer = styled.div`
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  max-width: 500px;
`;

const InfoContainer = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
  width: 200px;
  color: ${colors.red};
`;
