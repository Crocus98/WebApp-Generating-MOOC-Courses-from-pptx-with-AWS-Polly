import React from "react";
import styled from "styled-components";
import colors from "../style/colors";
import Header from "../components/Header";
import { Outlet } from "react-router-dom";
import Footer from "../components/Footer";

type Props = {
  children?: React.ReactNode;
};

export default function MainLayout({ children }: Props) {
  return (
    <AppContainer>
      <Header />
      <Outlet />
      <Footer />
    </AppContainer>
  );
}

const AppContainer = styled.div`
  height: 100vh;
  background-color: ${colors.lightGrey};
  overflow: auto;
`;
