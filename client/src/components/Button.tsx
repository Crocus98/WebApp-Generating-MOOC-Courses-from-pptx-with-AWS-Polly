import React from "react";
import styled from "styled-components";
import colors from "../style/colors";

interface Props extends React.HTMLAttributes<HTMLButtonElement> {}

export default function Button({ children, ...divProps }: Props) {
  return <ButtonContainer {...divProps}>{children}</ButtonContainer>;
}

const ButtonContainer = styled.button`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 10px 30px;
  text-align: center;
  background-color: ${colors.purple};
  color: ${colors.white};
  font-size: 18px;
  border: none;
  border-radius: 4px;

  &:hover {
    background-color: ${colors.darkPurple};
    transition: 0.2s;
    cursor: pointer;
  }
`;
