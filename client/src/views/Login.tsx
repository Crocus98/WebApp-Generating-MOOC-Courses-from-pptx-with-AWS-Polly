import React from "react";
import styled from "styled-components";
import Card from "../components/Card";

type Props = {};

export const AuthLayoutContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 50px 0;
`;

export const AuthCard = styled(Card)`
  max-width: calc(100vh - 40px);
  width: 600px;
  min-height: 400px;
`;

export default function Login({}: Props) {
  return (
    <AuthLayoutContainer>
      <AuthCard>Login</AuthCard>
    </AuthLayoutContainer>
  );
}
