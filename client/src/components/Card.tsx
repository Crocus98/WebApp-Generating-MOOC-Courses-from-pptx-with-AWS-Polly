import React, { HTMLAttributes } from "react";
import colors from "../style/colors";
import styled from "styled-components";

interface Props extends HTMLAttributes<HTMLDivElement> {}

export default function Card({ children, ...rest }: Props) {
  return <CardContainer {...rest}>{children}</CardContainer>;
}

const CardContainer = styled.div`
  background-color: ${colors.white};
  box-shadow: 0px 2px 4px rgba(26, 26, 26, 0.25);
  border-radius: 4px;
`;
