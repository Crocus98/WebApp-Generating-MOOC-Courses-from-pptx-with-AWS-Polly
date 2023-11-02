import React, { useContext, useEffect, useState } from "react";
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
import { isString, set } from "lodash";
import Button from "../components/Button";
import ProjectItem from "../components/ProjectItem";
import JSZip from "jszip";
import { isPPTXValid, zipPowerpoint } from "../services/ppt";
import { createProject } from "../services/project";
import { AuthContext, isAuthenticated } from "../components/AuthContext";

type Props = {};

export default function ReservedArea({}: Props) {
  const { state: authState } = useContext(AuthContext);
  const authenticated = isAuthenticated(authState);

  const isAdmin = authenticated ? authState.admin : false;

  const [tokens, setTokens] = useState<string[] | null>(null);

  useEffect(() => {
    setTokens(null);
    axios
      .get("/v1/public/tokens")
      .then((res) => setTokens(res.data.tokens))
      .catch((err) => console.error(err));
  }, []);

  const createToken = async () => {
    try {
      const res = await axios.post<{
        token: string;
      }>("/v1/public/token");
      setTokens([res.data.token, ...(tokens || [])]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <MainContentContainer>
      <Text.H2>Access Tokens</Text.H2>
      <Button onClick={createToken} style={{ marginBottom: 30 }}>
        <FontAwesomeIcon icon="plus" /> Create new token
      </Button>
      <TokenContainer>
        {tokens?.map((t) => (
          <Text.P key={t}>{t}</Text.P>
        ))}
      </TokenContainer>
    </MainContentContainer>
  );
}

const MainContainer = styled.div`
  padding: 40px 20px;
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 20px;
`;

const TokenContainer = styled.div`
  max-height: 400px;
  overflow: auto;
`;
