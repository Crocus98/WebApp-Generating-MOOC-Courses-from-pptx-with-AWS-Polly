import React from "react";
import styled from "styled-components";
import colors from "../style/colors";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import bwLogo from "../media/BWLogo.png";

export default function Footer() {
  return (
    <FooterContainer>
      <LinkList>
        <TextLink to="/">Home</TextLink>
        <TextLink to="/help">Help</TextLink>
        <TextLink to="https://docs.aws.amazon.com/polly/latest/dg/supportedtags.html">
          Supported Tags
        </TextLink>
      </LinkList>
      <BWLogo src={bwLogo} alt="Polly" />
      <CopyrightText>
        <FontAwesomeIcon icon={"copyright"} size="sm" />
        Polly AI 2023
      </CopyrightText>
    </FooterContainer>
  );
}

const FooterContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding-top: 10px;
  max-width: min(calc(100% - 40px), 1000px);
  margin: auto;
`;

const LinkList = styled.div`
  display: flex;
  flex-direction: row;
  gap: 20px;
  justify-content: center;
`;

const TextLink = styled(Link)`
  color: ${colors.darkGrey};
  font-size: 16px;
  text-decoration: none;
  width: 200px;
  text-align: center;

  &:hover {
    color: ${colors.purple};
  }
`;

const CopyrightText = styled.div`
  color: ${colors.darkGrey};
  font-size: 16px;
  text-decoration: none;
  align-self: center;
`;

const BWLogo = styled.img`
  height: 46px;
  align-self: center;
  margin: 10px 0;

  object-fit: contain;
`;
