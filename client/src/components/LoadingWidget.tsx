import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import colors from "../style/colors";
import styled from "styled-components";

type Props = {};

export default function LoadingWidget({}: Props) {
  return (
    <Container>
      <FontAwesomeIcon className="rotate-spinner" icon={"spinner"} size="3x" />
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: none;
  color: ${colors.purple};

  @-moz-keyframes spin {
    from {
      -moz-transform: rotate(0deg);
    }
    to {
      -moz-transform: rotate(360deg);
    }
  }
  @-webkit-keyframes spin {
    from {
      -webkit-transform: rotate(0deg);
    }
    to {
      -webkit-transform: rotate(360deg);
    }
  }
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  > .rotate-spinner {
    animation: spin 1s linear infinite;
  }
`;
