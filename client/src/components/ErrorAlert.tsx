import React, { useEffect, useState } from "react";
import styled from "styled-components";
import colors from "../style/colors";
import * as Text from "./Text";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type Props = {
  error: {
    message?: string;
    id: number;
  };
};

export default function ErrorAlert({ error }: Props) {
  const { message: errorMessage, id } = error;

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (errorMessage) {
      setVisible(true);
    }
  }, [errorMessage, id]);

  return (
    <Container style={{ opacity: visible ? 1 : 0 }}>
      <Text.P style={{ flex: 1 }}>{errorMessage}</Text.P>
      <IconButton onClick={() => setVisible(false)}>
        <FontAwesomeIcon icon={"times"} size="1x" />
      </IconButton>
    </Container>
  );
}

const Container = styled.div`
  position: absolute;
  display: flex;
  top: 0;
  left: 0;
  right: 0;
  padding: 6px 10px;
  background-color: ${colors.red};
  color: ${colors.white};
  opacity: 1;
  transition: 0.2s;
  gap: 10px;
  align-items: center;
  z-index: 1000;
`;

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
  font-size: 18px;
  color: ${colors.white};
`;
