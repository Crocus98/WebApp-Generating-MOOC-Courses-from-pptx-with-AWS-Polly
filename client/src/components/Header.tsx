import React, { useContext } from "react";
import styled from "styled-components";
import logo from "../media/logo.svg";
import colors from "../style/colors";
import Button from "./Button";
import { Link } from "react-router-dom";
import { AuthActionType, AuthContext, isAuthenticated } from "./AuthContext";
import Avatar from "./Avatar";
import * as Text from "./Text";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type Props = {};

export default function Header({}: Props) {
  const { state: authState, dispatch } = useContext(AuthContext);
  const authenticated = isAuthenticated(authState);

  return (
    <HeaderContainer>
      <LogoContainer to={"/"} style={{ flex: 1 }}>
        <Logo src={logo} alt="Polly" />
        <LogoText>Polly</LogoText>
      </LogoContainer>
      {authenticated ? (
        <AvatarContainer>
          <Avatar initials={authState.lastName.charAt(0)} />
          <FontAwesomeIcon icon={"chevron-down"} />
          <DropdownContainer>
            <DropdownItem
              onClick={() => dispatch({ type: AuthActionType.LOGOUT })}
            >
              Logout
            </DropdownItem>
          </DropdownContainer>
        </AvatarContainer>
      ) : (
        <Button to="/signup">Registra Ora!</Button>
      )}
    </HeaderContainer>
  );
}

const DropdownItem = styled.button`
  display: block;
  width: 100%;
  padding: 10px 20px;
  border: none;
  background-color: transparent;
  text-align: right;
  cursor: pointer;
  font-size: 14px;
  color: ${colors.purple};
`;

const DropdownContainer = styled.div`
  display: none;
  position: absolute;
  right: 0;
  top: 80%;
  background-color: ${colors.white};
  border: solid 1px ${colors.purple};
  min-width: 150px;
`;

const AvatarContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  position: relative;
  height: 100%;

  &:hover ${DropdownContainer} {
    display: block;
  }
`;

const HeaderContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 75px;
  background-color: ${colors.green};
  padding: 0px 30px;
`;

const LogoContainer = styled(Link)`
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
