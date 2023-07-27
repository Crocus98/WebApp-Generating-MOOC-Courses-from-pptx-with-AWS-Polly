import React, { useRef } from "react";
import styled from "styled-components";
import colors from "../style/colors";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import EditorQuickActions from "./EditorQuickActions";
import Player from "./Player";

type Props = {
  slideNumber: number;
  lastSlideNumber: number;
  goPreviousSlide: () => void;
  goNextSlide: () => void;

  content: string;
  onChange: (content: string) => void;
};

const EDITOR_WIDTH = 600;

export default function SlideEditor({
  slideNumber,
  lastSlideNumber,
  goPreviousSlide,
  goNextSlide,

  content,
  onChange,
}: Props) {
  const input = useRef<HTMLTextAreaElement>(null);

  const selectQuickAction = (quickAction: string) => {
    let selectionStart = input.current?.selectionStart || 0;
    let selectionEnd = input.current?.selectionEnd || selectionStart;

    selectionStart = Math.min(content.length, selectionStart);
    selectionEnd = Math.min(
      Math.max(selectionStart, selectionEnd),
      content.length
    );
    onChange(
      [
        content.slice(0, selectionStart),
        quickAction,
        content.slice(selectionEnd),
      ].join("")
    );
  };

  return (
    <Container>
      <SlidePreviewContainer>
        <IconButton onClick={goPreviousSlide} disabled={slideNumber === 1}>
          <FontAwesomeIcon icon={"chevron-left"} size="xl" />
        </IconButton>
        <SlidePreview>
          <span>{slideNumber}</span>
        </SlidePreview>
        <IconButton
          onClick={goNextSlide}
          disabled={slideNumber === lastSlideNumber}
        >
          <FontAwesomeIcon icon={"chevron-right"} size="xl" />
        </IconButton>
      </SlidePreviewContainer>
      <VoicePreviewContainer>
        <Player audio={undefined} loading={false} />
      </VoicePreviewContainer>
      <NotesEditorContentContainer>
        <NotesEditorContainer>
          <ToolbarContainer>
            <EditorQuickActions
              name="Voci"
              options={[
                {
                  label: "Micheal",
                  value: "<speak voice_name='micheal'></speak>",
                },
                { label: "Laura", value: "<speak voice_name='laura'></speak>" },
                {
                  label: "Giuseppe",
                  value: "<speak voice_name='giuseppe'></speak>",
                },
                { label: "Maria", value: "<speak voice_name='maria'></speak>" },
              ]}
              color={colors.orange}
              onClick={selectQuickAction}
            />
            <EditorQuickActions
              name="SSML Tags"
              options={[
                { label: "Pausa", value: '<break time="1s"/>' },
                {
                  label: "Lingua",
                  value: '<lang xml:lang="en-US">English Text</lang>',
                },
                {
                  label: "Volume e Velocità",
                  value: '<prosody volume="-6dB" rate="slow">Testo</prosody>',
                },
                {
                  label: "Say-As",
                  value:
                    '<say-as interpret-as="value">[text to be interpreted]</say-as>',
                },
                {
                  label: "Pausa Paragrafo",
                  value: "<p>Testo Paragrafo</p ",
                },
                {
                  label: "Pronuncia Fonetica",
                  value: '<phoneme alphabet="ipa" ph="pɪˈkɑːn">pecan</phoneme>',
                },
              ]}
              color={colors.purple}
              onClick={selectQuickAction}
            />
          </ToolbarContainer>
          <NotesEditor
            ref={input}
            value={content}
            onChange={(e) => onChange(e.target.value)}
          />
          <DocsContainer
            href="https://docs.aws.amazon.com/polly/latest/dg/supportedtags.html"
            target="_blank"
          >
            Documentazione tag SSML supportati
          </DocsContainer>
        </NotesEditorContainer>
      </NotesEditorContentContainer>
    </Container>
  );
}

const IconButton = styled.button`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  border: none;
  background-color: transparent;
  cursor: pointer;
  height: 28px;
  width: 28px;
  color: ${colors.black};
`;
const Container = styled.div`
  background-color: ${colors.lightGrey};
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const SlidePreviewContainer = styled.div`
  flex: 2;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: row;
  gap: 10px;
`;

const SlidePreview = styled.div`
  background-color: ${colors.white};
  border-radius: 8px;
  border: solid 2px ${colors.darkGrey};
  display: flex;
  justify-content: center;
  align-items: center;
  width: 480px;
  height: 200px;
`;

const VoicePreviewContainer = styled.div`
  background-color: ${colors.green};
  height: 40px;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const NotesEditorContentContainer = styled.div`
  flex: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
`;

const NotesEditorContainer = styled.div`
  margin-top: 50px;
  flex: 1;
  display: flex;
  flex-direction: column;
  border: solid 1px ${colors.purple};
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  border-bottom: none;
  width: ${EDITOR_WIDTH}px;
  background-color: ${colors.white};
`;

const ToolbarContainer = styled.div`
  display: flex;
  flex-direction: row;
  padding: 6px 10px;
  min-height: 30px;
  gap: 15px;
  border-bottom: solid 1px ${colors.purple};
`;

const NotesEditor = styled.textarea`
  padding: 10px;
  flex: 1;
  border: none;
  outline: none;
  resize: none;
`;

const DocsContainer = styled.a`
  padding: 5px 0;
  text-align: center;
  background-color: ${colors.lightGrey};
  color: ${colors.purple};
  width: 100%;
  font-size: 12px;

  &:hover {
    color: ${colors.darkPurple};
  }
`;
