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
        <TextLinkOutside href="/help" target="_blank" rel="noreferrer">
          Help
        </TextLinkOutside>
        <TextLinkOutside
          href="https://docs.aws.amazon.com/polly/latest/dg/supportedtags.html"
          target="_blank"
          rel="noreferrer"
        >
          Supported Tags
        </TextLinkOutside>
      </LinkList>
      <BWLogo src={bwLogo} alt="Polly" />
      <CopyrightText>
        <FontAwesomeIcon
          icon={"copyright"}
          size="sm"
          style={{ paddingRight: 5 }}
        />
        Polly AI 2023 - Politecnico di Milano
      </CopyrightText>
      <CopyrightText style={{ margin: "0px 0px 10px 0px" }}>
        Angelo Iacoella ● Matteo Savino ● Giacomo Vinati
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

const TextLinkOutside = styled.a`
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
  margin-bottom: 10px;
`;

const BWLogo = styled.img`
  height: 46px;
  align-self: center;
  margin: 10px 0;
  object-fit: contain;
`;
