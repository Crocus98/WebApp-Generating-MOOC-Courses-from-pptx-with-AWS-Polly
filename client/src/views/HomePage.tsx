import React from "react";
import styled from "styled-components";
import MainContentContainer from "../components/MainContentContainer";
import * as Text from "../components/Text";
import Button from "../components/Button";
import pollyVideo from "../media/pollyVideo.png";
import slideExample from "../media/slideExample.png";
import notesExample from "../media/notesExample.png";

type Props = {};

export default function HomePage({}: Props) {
  return (
    <MainContentContainer>
      <FirstSectionContainer>
        <Text.H2>
          Give voice to your MOOCs from simple PowerPoint presentations.
        </Text.H2>
        <Text.P>
          With Polly, you can generate the multimedia content for your Massive
          Open Online Courses in a fraction of the time it used to take.
        </Text.P>
        <img src={pollyVideo} alt="Prova polly!"></img>
        <Text.H3>Design your video, Polly adds the voice!</Text.H3>
        <Button to="/signup">Try it Now!</Button>
      </FirstSectionContainer>
      <SecondSectionContainer>
        <Text.H2 style={{ marginBottom: 35 }}>Come Funziona?</Text.H2>
        <ParagraphContainer>
          <Text.H3>
            1. Create the content for your video as PowerPoint slides.
          </Text.H3>
          <SecondSectionContentContainer>
            <div>
              <Text.P style={{ marginBottom: 20 }}>
                Create a PowerPoint presentation containing the visual support
                you want in the final multimedia content of your video course.
              </Text.P>
              <Text.P>
                Add text, images, drawings, and animations that you want to see
                in the finished video.
              </Text.P>
            </div>
            <img src={slideExample} alt="Prova polly!"></img>
          </SecondSectionContentContainer>
        </ParagraphContainer>
        <ParagraphContainer>
          <Text.H3>2. Add the script for your video</Text.H3>
          <Text.P>
            After creating the PowerPoint presentation, add in the notes of each
            slide what you want to be explained in the final video. The script
            you write will be used by Polly to generate the audio for your video
            course.
          </Text.P>
          <img src={notesExample} alt="Prova polly!"></img>
        </ParagraphContainer>
        <ParagraphContainer>
          <Text.H3>3. Use Polly to generate the voice for your MOOC.</Text.H3>
          <Text.P>
            After creating the design and writing the script for your MOOC, use
            Polly's tool to generate the voice for your video course. Simply
            upload the .pptx file of the PowerPoint presentation you created to
            generate a copy containing the audio generated voice inserted in
            each slide.
          </Text.P>
          <Text.P>
            To generate the multimedia content for your course, simply export
            the generated presentation as a video directly from the PowerPoint
            application.
          </Text.P>
        </ParagraphContainer>
      </SecondSectionContainer>
    </MainContentContainer>
  );
}

const FirstSectionContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 700px;
  text-align: center;
  gap: 20px;
`;

const SecondSectionContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 50px 30px;
`;

const SecondSectionContentContainer = styled.div`
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
