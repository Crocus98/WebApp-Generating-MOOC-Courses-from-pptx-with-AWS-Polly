import React from "react";
import colors from "../style/colors";
import styled from "styled-components";

interface Props extends React.HTMLAttributes<HTMLDivElement> {}

export default function MainContentContainer({ children, ...rest }: Props) {
  return (
    <MainContentContainerDiv {...rest}>{children}</MainContentContainerDiv>
  );
}

const MainContentContainerDiv = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: ${colors.white};
  border-width: 0px 2px;
  border-style: solid;
  border-color: #7858a4;
  box-shadow: 0px 4px 4px #7858a4;
  min-height: 400px;
  padding-bottom: 20px;
  padding-top: 20px;
  max-width: min(calc(100% - 40px), 1000px);
  margin: auto;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
`;
