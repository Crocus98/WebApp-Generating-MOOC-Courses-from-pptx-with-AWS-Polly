import React, { useState } from "react";
import styled from "styled-components";
import colors from "../style/colors";
import classNames from "classnames";
import Button from "./Button";
import ProjectCreationModal from "./ProjectCreationModal";
import * as Text from "./Text";
import FileInput from "./FileInput";
import { useNavigate } from "react-router-dom";
import { isPPTXValid } from "../services/ppt";
import { isString } from "lodash";
import { deleteProject, editProject } from "../services/project";
import { AxiosError } from "axios";

type Props = {
  slidePreviews: string[];
  focus: number;
  onFocus: (index: number) => void;
  projectName: string;
};

export default function EditorSideBar({
  slidePreviews,
  focus,
  onFocus,
  projectName,
}: Props) {
  const [settingsProjectModalOpen, setSettingsProjectModalOpen] =
    useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [genericError, setGenericError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteProjectState, setDeleteProjectState] = useState(0);
  const navigate = useNavigate();

  const onSubmit = async () => {
    if (loading) return;

    setGenericError(null);
    if (!file) {
      return setGenericError("Please insert a file");
    }

    const error = await isPPTXValid(file);
    if (error) {
      return setGenericError(isString(error) ? error : "Errore sconosciuto");
    }

    setLoading(true);
    try {
      await editProject(projectName, file);
      window.location.reload();
      setLoading(false);
    } catch (err) {
      if (err instanceof AxiosError) {
        setGenericError(err.response?.data?.message || err.message);
      } else if (err instanceof Error) {
        setGenericError(err.message);
      } else {
        setGenericError("Errore sconosciuto");
      }
      setLoading(false);
    }
  };

  const onDelete = async () => {
    setLoading(true);
    try {
      await deleteProject(projectName);
      navigate(`/`);
      setLoading(false);
    } catch (err) {
      if (err instanceof AxiosError) {
        setGenericError(err.response?.data?.message || err.message);
      } else if (err instanceof Error) {
        setGenericError(err.message);
      } else {
        setGenericError("Errore sconosciuto");
      }
      setLoading(false);
    }
  };

  return (
    <ContainerContainer>
      <ProjectCreationModal
        isOpen={settingsProjectModalOpen}
        onClose={() => setSettingsProjectModalOpen(false)}
      >
        <Text.H2>Project Settings</Text.H2>
        <FileInput
          file={file}
          setFile={(file) => {
            setFile(file);
            setGenericError(null);
          }}
          style={{ alignSelf: "center" }}
          loading={loading}
        />
        {genericError && <ErrorText>{genericError}</ErrorText>}
        <Button
          disabled={loading}
          style={{
            backgroundColor: loading ? colors.darkGrey : colors.purple,
          }}
          onClick={onSubmit}
        >
          Overwrite Project PPTX
        </Button>
        <SeparatorContainer>
          <Separator />
          <span>or</span>
          <Separator />
        </SeparatorContainer>
        <Button
          disabled={loading || deleteProjectState !== 0}
          style={{
            backgroundColor:
              loading || deleteProjectState !== 0
                ? colors.darkGrey
                : colors.red,
          }}
          onClick={() => setDeleteProjectState(1)}
        >
          Delete Project
        </Button>
        {deleteProjectState === 1 && (
          <Button
            disabled={loading}
            style={{
              backgroundColor: loading ? colors.darkGrey : colors.red,
            }}
            onClick={onDelete}
          >
            Delete Project Forever
          </Button>
        )}
      </ProjectCreationModal>

      <Container>
        <SlideList>
          {slidePreviews.map((slide64, i) => (
            <SlideButton
              key={i}
              onClick={() => onFocus(i)}
              style={focus === i ? { color: colors.purple } : undefined}
            >
              <span style={{ paddingRight: 10 }}>{i + 1}</span>
              <SlidePreview
                style={
                  focus === i
                    ? {
                        borderColor: colors.purple,
                        borderWidth: 2,
                        color: colors.purple,
                        backgroundColor: colors.lightGrey,
                      }
                    : undefined
                }
                src={slide64}
                alt="Can't load preview"
              />
            </SlideButton>
          ))}
        </SlideList>
      </Container>
      <Button
        type="button"
        onClick={() => setSettingsProjectModalOpen(true)}
        style={{
          backgroundColor: colors.darkGrey,
          color: colors.white,
          margin: 10,
        }}
      >
        Project Settings
      </Button>
    </ContainerContainer>
  );
}

const SeparatorContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  margin: 20px 0;
`;
const Separator = styled.div`
  flex: 1;
  height: 1px;
  background-color: ${colors.darkGrey};
`;

const ContainerContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  border-right: solid 1px ${colors.purple};
`;

const SlideList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-items: center;
  width: 100%;
  padding: 20px 0;

  background-color: ${colors.white};

  overflow: scroll;
`;

const SlideButton = styled.button`
  display: flex;
  flex-direction: row;
  background-color: ${colors.white};
  border: none;
  outline: none;
  &:hover {
    cursor: pointer;
    img {
      border: solid 2px ${colors.purple};
    }
  }

  > span {
    font-size: 18px;
  }
`;

const SlidePreview = styled.img`
  display: block;
  width: 100px;
  height: 100px;
  object-fit: cover;
  border: solid 2px ${colors.darkGrey};
  border-radius: 8px;
`;

const ErrorText = styled(Text.P)`
  color: ${colors.orange};
  margin: 10px 0;
  text-align: center;
`;
