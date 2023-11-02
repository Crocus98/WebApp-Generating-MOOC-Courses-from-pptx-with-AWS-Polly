import React, { useRef } from "react";
import styled from "styled-components";
import colors from "../style/colors";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import EditorQuickActions from "./EditorQuickActions";
import {
  AudioPreviewType,
  EditorAction,
  EditorActionType,
  NotesType,
} from "../views/Editor";
import VoicePreviewBar from "./VoicePreviewBar";
import { retrievePreview } from "../services/project";
import ErrorAlert from "./ErrorAlert";
import { AxiosError } from "axios";
import Button from "./Button";

type Props = {
  dispatch: React.Dispatch<EditorAction>;

  slideNumber: number;
  lastSlideNumber: number;
  goPreviousSlide: () => void;
  goNextSlide: () => void;
  audioPreview: AudioPreviewType;
  slidePreview: string;

  notes: NotesType;
  onChange: (content: string) => void;

  error: {
    message?: string;
    id: number;
  };
};

export const EDITOR_WIDTH = 600;

export default function SlideEditor({
  slideNumber,
  lastSlideNumber,
  goPreviousSlide,
  goNextSlide,
  audioPreview,
  slidePreview,
  dispatch,

  notes,
  onChange,

  error,
}: Props) {
  const input = useRef<HTMLTextAreaElement>(null);

  const selectQuickAction = (quickAction: string) => {
    let selectionStart = input.current?.selectionStart || 0;
    let selectionEnd = input.current?.selectionEnd || selectionStart;
    const content = notes.data;
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

  const onGeneratePreview = async () => {
    try {
      dispatch({
        type: EditorActionType.GENERATE_PREVIEW_INIT,
        payload: { slideIndex: slideNumber - 1 },
      });
      const preview = await retrievePreview(notes.data);
      dispatch({
        type: EditorActionType.GENERATE_PREVIEW_END,
        payload: { slideIndex: slideNumber - 1, preview },
      });
    } catch (error) {
      let message = "Unknown error occured while generating preview";
      if (error instanceof AxiosError) {
        message = error.response
          ? JSON.stringify(error.response.data)
          : message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      dispatch({
        type: EditorActionType.ERROR,
        payload: { error: message },
      });
      dispatch({
        type: EditorActionType.GENERATE_PREVIEW_END,
        payload: { slideIndex: slideNumber - 1, preview: null },
      });
    }
  };

  return (
    <Container>
      <SlidePreviewContainer>
        <ErrorAlert error={error} />
        <IconButton onClick={goPreviousSlide} disabled={slideNumber === 1}>
          <FontAwesomeIcon icon={"chevron-left"} size="xl" />
        </IconButton>
        <SlidePreview>
          <SlidePreviewImage src={slidePreview} alt="Can't load preview" />
        </SlidePreview>
        <IconButton
          onClick={goNextSlide}
          disabled={slideNumber === lastSlideNumber}
        >
          <FontAwesomeIcon icon={"chevron-right"} size="xl" />
        </IconButton>
      </SlidePreviewContainer>
      <VoicePreviewBar
        audio={audioPreview}
        onGeneratePreview={onGeneratePreview}
        isPreviewOutdated={audioPreview.timestamp < notes.timestamp}
      />
      <NotesEditorContentContainer>
        <NotesEditorContainer>
          <ToolbarContainer>
            <EditorQuickActions
              name="Voci"
              options={VOICE_OPTIONS}
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
                  value: "<p>Testo Paragrafo</p>",
                },
                {
                  label: "Pronuncia Fonetica",
                  value: '<phoneme alphabet="ipa" ph="pɪˈkɑːn">pecan</phoneme>',
                },
              ]}
              color={colors.purple}
              onClick={selectQuickAction}
            />
            <div style={{ flex: 2 }}></div>
            <HelpButton href="/help" target="_blank" rel="noreferrer">
              <FontAwesomeIcon icon={"info"} />
              Help
            </HelpButton>
          </ToolbarContainer>
          <NotesEditor
            ref={input}
            value={notes.data}
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
  position: relative;
`;

const SlidePreview = styled.div`
  position: relative;
  overflow: hidden;
  background-color: ${colors.white};
  border-radius: 8px;
  border: solid 2px ${colors.darkGrey};
  display: flex;
  justify-content: center;
  align-items: center;
`;

const SlidePreviewImage = styled.img`
  height: 250px;
  max-width: 600px;
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

const DEFAULT_NAME = "Brian";
const VOICE_NAMES = [
  "Brian",
  "Amy",
  "Arthur",
  "Joanna",
  "Ruth",
  "Matthew",
  "Stephen",
  "Bianca",
  "Adriano",
];

const createVoiceOptions = () =>
  VOICE_NAMES.map((name) => ({
    label: name + (name === DEFAULT_NAME ? " (default)" : ""),
    value: `<voice voice_name='${name}'>\n\n</voice>`,
  }));

const VOICE_OPTIONS = createVoiceOptions();

const HelpButton = styled.a`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: row;
  gap: 10px;
  padding: 0 12px;
  text-align: center;
  color: ${colors.white};
  font-size: 15px;
  border: none;
  border-radius: 4px;
  height: 29px;
  background-color: ${colors.green};

  &:hover {
    cursor: pointer;
    background-color: ${colors.darkGrey};
  }
`;
