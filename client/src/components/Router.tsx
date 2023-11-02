import React, { useContext } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import HomePage from "../views/HomePage";
import Signup from "../views/Signup";
import Login from "../views/Login";
import { AuthContext, isAuthenticated } from "./AuthContext";
import ReservedArea from "../views/ReservedArea";
import ProjectList from "../views/ProjectList";
import Editor from "../views/Editor";
import Help from "../views/Help";

type Props = {};

function StrictlyAdmin({ children }: { children: JSX.Element }) {
  const { state: authState } = useContext(AuthContext);
  const authenticated = isAuthenticated(authState);
  const location = useLocation();

  if (!authenticated || !authState.admin) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
}

function StrictlyAnonymous({ children }: { children: JSX.Element }) {
  const { state: authState } = useContext(AuthContext);
  const authenticated = isAuthenticated(authState);
  const location = useLocation();

  if (authenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
}

function RequireAuth({ children }: { children: JSX.Element }) {
  const { state: authState } = useContext(AuthContext);
  const authenticated = isAuthenticated(authState);
  const location = useLocation();

  if (!authenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function SmartRouter({
  authChildren,
  anonymChildren,
}: {
  authChildren: JSX.Element;
  anonymChildren: JSX.Element;
}) {
  const { state: authState } = useContext(AuthContext);
  const authenticated = isAuthenticated(authState);

  if (authenticated) {
    return authChildren;
  } else {
    return anonymChildren;
  }
}

export default function Router({}: Props) {
  return (
    <Routes>
      <Route
        path="/project/:projectName"
        element={
          <RequireAuth>
            <Editor />
          </RequireAuth>
        }
      />

      <Route path="/" element={<MainLayout />}>
        <Route
          index
          element={
            <SmartRouter
              authChildren={<ProjectList />}
              anonymChildren={<HomePage />}
            />
          }
        />
        <Route
          path="login"
          element={
            <StrictlyAnonymous>
              <Login />
            </StrictlyAnonymous>
          }
        />
        <Route
          path="signup"
          element={
            <StrictlyAnonymous>
              <Signup />
            </StrictlyAnonymous>
          }
        />
        <Route
          path="reserved"
          element={
            <StrictlyAdmin>
              <ReservedArea />
            </StrictlyAdmin>
          }
        />
        <Route path="help" element={<Help />} />
        <Route path="*" element={<>404</>} />
      </Route>
    </Routes>
  );
}
