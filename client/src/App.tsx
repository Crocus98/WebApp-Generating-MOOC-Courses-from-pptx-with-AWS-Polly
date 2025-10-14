import React from "react";
import "./App.css";
import Router from "./components/Router";
import { AuthProvider } from "./components/AuthContext";
import "./style/iconsLibrary";

function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}

export default App;
