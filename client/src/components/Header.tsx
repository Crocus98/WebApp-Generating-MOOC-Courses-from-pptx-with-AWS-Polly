import React from "react";
import styled from "styled-components";
import logo from "../media/logo.svg";
import colors from "../style/colors";
import Button from "./Button";

type Props = {};

export default function Header({}: Props) {
  return (
    <HeaderContainer>
      <LogoContainer style={{ flex: 1 }}>
        <Logo src={logo} alt="Polly" />
        <LogoText>Polly</LogoText>
      </LogoContainer>
      <Button>Registra Ora!</Button>
    </HeaderContainer>
  );
}

const HeaderContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 75px;
  background-color: ${colors.green};
  padding: 0px 30px;
`;

const LogoContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const Logo = styled.img`
  display: block;
  height: 46px;
`;

const LogoText = styled.h2`
  display: inline-block;
  margin: 0px;
  padding: 0px;
  font-size: 24px;
  color: ${colors.white};
  margin-left: 20px;
  font-weight: 400;
  letter-spacing: 0.2em;
`;
