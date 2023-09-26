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

type Props = {
  projectName?: string;
  onDownload?: () => void;
  onSave?: () => void;
  loadingDownload?: boolean;
  loadingSave?: boolean;
  hasUnsavedChanges?: boolean;
};

export default function Header({
  projectName,
  onDownload,
  loadingDownload,
  onSave,
  hasUnsavedChanges,
  loadingSave,
}: Props) {
  const { state: authState, dispatch } = useContext(AuthContext);
  const authenticated = isAuthenticated(authState);

  return (
    <HeaderContainer>
      <LogoContainer to={"/"}>
        <Logo src={logo} alt="Polly" />
        <LogoText>Polly</LogoText>
      </LogoContainer>
      {projectName ? (
        <ProjectContainer>
          <div />
          <Text.P>{projectName}</Text.P>
          <ProjectActionsContainer>
            <IconButton
              style={{
                backgroundColor: hasUnsavedChanges
                  ? colors.purple
                  : colors.darkGrey,
              }}
              onClick={onSave}
              disabled={!hasUnsavedChanges}
            >
              {loadingSave ? (
                <FontAwesomeIcon
                  className="rotate-spinner"
                  icon={"spinner"}
                  size="sm"
                />
              ) : (
                <FontAwesomeIcon icon={"floppy-disk"} size="sm" />
              )}
            </IconButton>
            <IconButton
              style={{
                backgroundColor: loadingDownload
                  ? colors.darkGrey
                  : colors.orange,
                width: 60,
              }}
              onClick={onDownload}
              disabled={loadingDownload}
            >
              {loadingDownload ? (
                <FontAwesomeIcon
                  className="rotate-spinner"
                  icon={"spinner"}
                  size="sm"
                />
              ) : (
                <SaveDownload>
                  <FontAwesomeIcon
                    icon={"floppy-disk"}
                    style={{
                      fontSize: 13,
                      right: 2,
                      bottom: -1,
                      position: "absolute",
                    }}
                  />
                  <FontAwesomeIcon
                    icon={"download"}
                    size="sm"
                    style={{
                      fontSize: 18,
                      top: -10,
                      left: -3,
                      position: "absolute",
                    }}
                  />
                </SaveDownload>
              )}
            </IconButton>
          </ProjectActionsContainer>
        </ProjectContainer>
      ) : (
        <div />
      )}
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
        <ActionContainer>
          <LoginButton to="/login">Login</LoginButton>
          <Button to="/signup">Signup Now!</Button>
        </ActionContainer>
      )}
    </HeaderContainer>
  );
}

const LoginButton = styled(Link)`
  color: white;

  &:hover {
    color: ${colors.purple};
  }
`;

const ActionContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 30px;
`;

const SaveDownload = styled.div`
  position: absolute;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

const ProjectContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  color: ${colors.white};
  align-items: center;
`;

const ProjectActionsContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  gap: 10px;
  padding: 0 20px;
`;

const IconButton = styled.button`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  border: none;
  background-color: transparent;
  cursor: pointer;
  height: 28px;
  width: 28px;
  color: ${colors.white};
  background-color: ${colors.orange};
  border-radius: 999px;

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
  justify-content: flex-end;

  &:hover ${DropdownContainer} {
    display: block;
  }
`;

const HeaderContainer = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto;
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
