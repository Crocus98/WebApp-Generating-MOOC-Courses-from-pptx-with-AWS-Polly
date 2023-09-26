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
          Dai voce ai tuoi MOOC da semplici presentazioni PowerPoint
        </Text.H2>
        <Text.P>
          Con Polly puoi generare i contenuti multimediali dei tuoi Massive Open
          Online Courses in una frazione del tempo che impiegavi prima.
        </Text.P>
        <img src={pollyVideo} alt="Prova polly!"></img>
        <Text.H3>Crea i design dei tuoi video, Polly ci mette la voce!</Text.H3>
        <Button to="/signup">Provalo Ora!</Button>
      </FirstSectionContainer>
      <SecondSectionContainer>
        <Text.H2 style={{ marginBottom: 35 }}>Come Funziona?</Text.H2>
        <ParagraphContainer>
          <Text.H3>
            1. Crea i contenuti del tuo video come slide PowerPoint
          </Text.H3>
          <SecondSectionContentContainer>
            <div>
              <Text.P style={{ marginBottom: 20 }}>
                Crea una presentazione PowerPoint contente il supporto grafico
                che vuoi avere nel contenuto multimediale finale del tuo
                videocorso.
              </Text.P>
              <Text.P>
                Aggiungi testo, immagini, disegni ed animazione che vorrai
                vedere nel video finito.
              </Text.P>
            </div>
            <img src={slideExample} alt="Prova polly!"></img>
          </SecondSectionContentContainer>
        </ParagraphContainer>
        <ParagraphContainer>
          <Text.H3>2. Aggiungi il copione del tuo video</Text.H3>
          <Text.P>
            Una volta creata la presentazione PowerPoint, aggiunti nelle note di
            ciascuna slide quello che vuoi che venga spiegato nel video finale.
            Il copione da te scritto sarà utilizzato da polly per generare
            l’audio del tuo videocorso.
          </Text.P>
          <img src={notesExample} alt="Prova polly!"></img>
        </ParagraphContainer>
        <ParagraphContainer>
          <Text.H3>3. Utilizza Polly per generare la voce del tuo MOOC</Text.H3>
          <Text.P>
            Dopo aver creato il design e scritto il copione del tuo MOOC,
            utilizza lo strumento di Polly per generare la voce del tuo
            videocorso. Ti basterà caricare il file .pptx della presentazione
            PowerPoint da te realizzata per generare una copia contente l’audio
            della voce generato inserita in ciascuna slide.
          </Text.P>
          <Text.P>
            Per generare il contenuto multimediale del tuo corso ti basterà
            esportare come video la presentazione generata, direttamente
            dall’applicazione di PowerPoint.
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
