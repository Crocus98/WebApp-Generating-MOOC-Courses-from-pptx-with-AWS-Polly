import React from "react";
import styled from "styled-components";

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export function H2({ children, ...rest }: HeadingProps) {
  return <StyledH2 {...rest}>{children}</StyledH2>;
}

export function H3({ children, ...rest }: HeadingProps) {
  return <StyledH3 {...rest}>{children}</StyledH3>;
}

interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export function P({ children, ...rest }: TextProps) {
  return <StyledP {...rest}>{children}</StyledP>;
}

const StyledH2 = styled.h2`
  display: block;
  margin: 0px;
  padding: 0px;
  font-weight: 400;
  letter-spacing: 0.2em;
  font-size: 30px;
`;

const StyledH3 = styled.h3`
  display: block;
  margin: 0px;
  padding: 0px;
  font-weight: 400;
  letter-spacing: 0.15em;
  font-size: 24px;
`;

const StyledP = styled.p`
  display: block;
  margin: 0px;
  padding: 0px;
  font-weight: 400;
  letter-spacing: 0.1em;
  font-size: 18px;
`;
