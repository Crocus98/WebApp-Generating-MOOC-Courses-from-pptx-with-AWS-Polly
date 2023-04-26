import React from "react";
import styled from "styled-components";
import colors from "../style/colors";
import { Link } from "react-router-dom";

interface Props extends React.HTMLAttributes<HTMLButtonElement> {
  to?: string;
}

export default function Button({ children, to, ...buttonProps }: Props) {
  const ButtonJSX = (
    <ButtonContainer {...buttonProps}>{children}</ButtonContainer>
  );
  return to != null ? <Link to={to}>{ButtonJSX}</Link> : ButtonJSX;
}

const ButtonContainer = styled.button`
  padding: 8px 20px;
  text-align: center;
  background-color: ${colors.purple};
  color: ${colors.white};
  font-size: 16px;
  border: none;
  border-radius: 4px;

  &:hover {
    background-color: ${colors.darkPurple};
    transition: 0.2s;
    cursor: pointer;
  }
`;
