import React from "react";
import styled from "styled-components";
import MainContentContainer from "../components/MainContentContainer";
import * as Text from "../components/Text";
import Button from "../components/Button";
import getStarted from "../media/getStarted.png";
import slideExample from "../media/slideExample.png";
import notesExample from "../media/notesExample.png";
import { EDITOR_WIDTH } from "../components/SlideEditor";
import colors from "../style/colors";
import EditorQuickActions from "../components/EditorQuickActions";

type Props = {};

export default function Help({}: Props) {
  return (
    <MainContentContainer>
      <FirstSectionContainer>
        <Text.H2>How to write your video scripts 101</Text.H2>
      </FirstSectionContainer>
      <SectionContainer>
        <ParagraphContainer>
          <Text.H2>1. Get Started</Text.H2>
          <SectionContentContainer>
            <div style={{ flex: 1 }}>
              <Text.P style={{ marginBottom: 20 }}>
                After creating your first project you will have access to the
                Editor. Here you can write your scripts, listen to the audio
                previews to see how they will sound once generated, and lastly,
                export your voiced over presentations.
              </Text.P>
              <Text.P>
                The easiest way you can get started is by writing a simple line
                in the first slide of your presentation, press “Generate
                Preview” and press the play button to listen to the preview
              </Text.P>
            </div>
            <EditorPreview>This is my first audio!</EditorPreview>
          </SectionContentContainer>
        </ParagraphContainer>
        <ParagraphContainer>
          <Text.H2>2. Voice Selection</Text.H2>
          <SectionContentContainer>
            <div style={{ flex: 1 }}>
              <Text.P style={{ marginBottom: 20 }}>
                Polly allows users to pick from a variety of different voices
                for their projects. To specify what voice to use simply use:
              </Text.P>
              <Text.P style={{ marginBottom: 20 }}>
                Under the hood Polly uses AWS Neural Voices:{" "}
                <a
                  href="https://docs.aws.amazon.com/polly/latest/dg/voicelist.html"
                  target="_blank"
                  rel="noreferrer"
                  style={{ textDecoration: "underline" }}
                >
                  Here you can find the complete list.
                </a>
              </Text.P>
            </div>
            <EditorPreview>
              <span>{"<voice voice_name='Arthur'>"}</span>
              <span style={{ paddingLeft: 20 }}>
                {"This will be generated using Arthur voice"}
              </span>
              <span>{"</voice>"}</span>
            </EditorPreview>
          </SectionContentContainer>

          <Text.H2>2.1 Multi Voice</Text.H2>
          <SectionContentContainer>
            <div style={{ flex: 1 }}>
              <Text.P style={{ marginBottom: 20 }}>
                Polly allows also to have multiple voices in the same slide.
                Simply use:
              </Text.P>
            </div>
            <EditorPreview>
              <span>{"<voice voice_name='Arthur'>"}</span>
              <span style={{ paddingLeft: 20 }}>
                {"This will be generated using Arthur voice"}
              </span>
              <span>{"</voice>"}</span>
              <span>&nbsp;</span>
              <span>{"<voice voice_name='Stephen'>"}</span>
              <span style={{ paddingLeft: 20 }}>
                {"While this one will be generated using Stephen voice"}
              </span>
              <span>{"</voice>"}</span>
            </EditorPreview>
          </SectionContentContainer>

          <Text.H2>3 Supported Tags</Text.H2>
          <SectionContentContainer>
            <div style={{ flex: 1 }}>
              <Text.P style={{ marginBottom: 20 }}>
                To fine tune the generated audio to your specific need Polly
                supports the following{" "}
                <a
                  href="https://docs.aws.amazon.com/polly/latest/dg/supportedtags.html"
                  target="_blank"
                  rel="noreferrer"
                  style={{ textDecoration: "underline" }}
                >
                  Supported SSML Tags.
                </a>
              </Text.P>
              <Text.P
                style={{
                  marginBottom: 20,
                  color: colors.red,
                  fontWeight: "bold",
                }}
              >
                WARNING: At this moment Polly implements only the tags with
                "Availability with Neural Voices"
              </Text.P>
            </div>
            <EditorPreview>
              <span>{"<voice voice_name='Arthur'>"}</span>
              <span style={{ paddingLeft: 20 }}>
                {"This will be generated using Arthur voice"}
              </span>
              <span>{"</voice>"}</span>
              <span>&nbsp;</span>
              <span>{"<voice voice_name='Stephen'>"}</span>
              <span style={{ paddingLeft: 20 }}>
                {"While this one will be generated using Stephen voice"}
              </span>
              <span>{"</voice>"}</span>
            </EditorPreview>
          </SectionContentContainer>
        </ParagraphContainer>
      </SectionContainer>
    </MainContentContainer>
  );
}

export const EditorPreview = ({ children }: { children: any }) => {
  return (
    <NotesEditorContainer>
      <ToolbarContainer>
        <EditorQuickActions
          name="Voci"
          options={[]}
          color={colors.orange}
          onClick={() => {}}
          disabled={true}
        />
        <EditorQuickActions
          name="SSML Tags"
          options={[]}
          color={colors.purple}
          onClick={() => {}}
          disabled={true}
        />
      </ToolbarContainer>
      <NotesEditor>{children}</NotesEditor>
    </NotesEditorContainer>
  );
};

const NotesEditor = styled.div`
  padding: 10px;
  flex: 1;
  border: none;
  outline: none;
  resize: none;
  display: flex;
  flex-direction: column;
`;
const ToolbarContainer = styled.div`
  display: flex;
  flex-direction: row;
  padding: 6px 10px;
  min-height: 30px;
  gap: 15px;
  border-bottom: solid 1px ${colors.purple};
`;

const FirstSectionContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  max-width: 700px;
  gap: 20px;
  text-align: center;

  overflow: hidden;

  img {
    width: 100%;
    height: auto;
  }
`;

const SectionContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 50px 30px;
`;

const SectionContentContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 20px;
`;

const ParagraphContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 30px;
`;

const NotesEditorContainer = styled.div`
  flex: 1;
  flex-direction: column;
  border: solid 1px ${colors.purple};
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  width: ${EDITOR_WIDTH}px;
  background-color: ${colors.white};
`;
