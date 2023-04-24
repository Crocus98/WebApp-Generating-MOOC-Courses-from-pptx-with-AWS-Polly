import React from "react";
import { Route, Routes } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import HomePage from "../views/HomePage";
import Signup from "../views/Signup";
import Login from "../views/Login";

type Props = {};

export default function Router({}: Props) {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
        <Route path="*" element={<>404</>} />
      </Route>
    </Routes>
  );
}
