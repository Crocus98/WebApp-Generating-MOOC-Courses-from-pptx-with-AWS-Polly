import React, { useEffect, useState } from "react";
import MainContentContainer from "../components/MainContentContainer";
import * as Text from "../components/Text";
import axios, { AxiosError } from "axios";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import colors from "../style/colors";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ProjectCreationModal from "../components/ProjectCreationModal";
import FormInput from "../components/FormInput";
import FileInput from "../components/FileInput";
import { SubmitHandler, useForm } from "react-hook-form";
import { set } from "lodash";
import Button from "../components/Button";
import ProjectItem from "../components/ProjectItem";
import JSZip from "jszip";
import { zipPowerpoint } from "../services/ppt";

type ProjectForm = {
  projectName: string;
};

type Props = {};

export default function ProjectList({}: Props) {
  const [projects, setProjects] = useState<string[] | null>(null);
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [genericError, setGenericError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ProjectForm>({
    mode: "onSubmit",
  });
  const navigate = useNavigate();

  useEffect(() => {
    setProjects(null);
    axios
      .get("/v1/public/list")
      .then((res) => setProjects(res.data))
      .catch((err) => console.error(err));
  }, []);

  const onSubmit: SubmitHandler<ProjectForm> = async (data) => {
    setGenericError(null);
    const projectName = data.projectName.trim();
    if (!file) {
      return setGenericError("Per favore inserisci un file");
    }

    setLoading(true);
    try {
      const fd = new FormData();

      const zipFile = await zipPowerpoint(file);

      fd.append("file", zipFile);
      fd.append("projectName", projectName);

      await axios.post("/v1/public/project", {
        projectName,
      });
      await axios.post("/v1/public/upload", fd);
      navigate(`/project/${projectName}`);
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
    <MainContentContainer>
      <ProjectCreationModal
        isOpen={createProjectModalOpen}
        onClose={() => setCreateProjectModalOpen(false)}
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          style={{ display: "flex", flexDirection: "column", gap: 20 }}
        >
          <Text.H2>Create new project:</Text.H2>
          <FormInput
            {...register("projectName", {
              required: "Per favore inserisci il nome del progetto",
              minLength: {
                value: 3,
                message: "Il nome deve essere lungo almeno 3 caratteri",
              },
              pattern: {
                value: /^[a-zA-Z0-9]+$/,
                message: "Il nome può contenere solo lettere e numeri",
              },
            })}
            placeholder="Nome"
            error={errors.projectName?.message}
          />
          <FileInput
            file={file}
            setFile={(file) => {
              setFile(file);
              setGenericError(null);
            }}
            style={{ alignSelf: "center" }}
          />
          {genericError && <ErrorText>{genericError}</ErrorText>}
          <Button>Crea nuovo progetto</Button>
        </form>
      </ProjectCreationModal>
      <Text.H2>Project List</Text.H2>
      {!projects ? (
        "Loading"
      ) : projects.length === 0 ? (
        <Text.P style={{ marginTop: 20 }}>
          Sembra che tu non abbia ancora creato il tuo primo progetto. Inizia
          subito!
        </Text.P>
      ) : (
        <ProjectListContainer>
          {projects.map((project) => (
            <ProjectItem key={project} name={project} />
          ))}
        </ProjectListContainer>
      )}
      <OpenProjectCreationButton
        onClick={() => setCreateProjectModalOpen(true)}
      >
        <FontAwesomeIcon icon={"plus"} size={"1x"} color={colors.white} />
      </OpenProjectCreationButton>
    </MainContentContainer>
  );
}

const OpenProjectCreationButton = styled.button`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 40px;
  height: 40px;
  background-color: ${colors.orange};
  border: none;
  cursor: pointer;
  border-radius: 999px;
  position: absolute;
  right: 20px;
  bottom: 20px;
`;

const ErrorText = styled(Text.P)`
  color: ${colors.orange};
  margin: 10px 0;
  text-align: center;
`;

const ProjectListContainer = styled.div`
  padding: 40px 20px;
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 20px;
`;
