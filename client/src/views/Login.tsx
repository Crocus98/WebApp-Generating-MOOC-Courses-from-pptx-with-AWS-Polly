import React, { useContext } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import FormInput from "../components/FormInput";
import Button from "../components/Button";
import {
  AuthCard,
  AuthCardTitle,
  AuthForm,
  AuthLayoutContainer,
  ChangeAuthLink,
  MainFormSection,
} from "./Signup";
import { AuthActionType, AuthContext } from "../components/AuthContext";
import { useNavigate } from "react-router-dom";

type Props = {};

type LoginForm = {
  email: string;
  password: string;
};

export default function Login({}: Props) {
  const { dispatch } = useContext(AuthContext);
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    mode: "onSubmit",
  });

  const onSubmit: SubmitHandler<LoginForm> = (data) => {
    dispatch({
      type: AuthActionType.LOGIN,
      payload: {
        firstName: "Io",
        lastName: "Io",
        email: data.email,
        token: "token",
      },
    });
    navigate("/");
  };

  return (
    <AuthLayoutContainer>
      <AuthCard>
        <AuthCardTitle>Accedi</AuthCardTitle>
        <AuthForm onSubmit={handleSubmit(onSubmit)} noValidate>
          <MainFormSection>
            <FormInput
              {...register("email", {
                required: "Per favore inserisci il tuo indirizzo email",
              })}
              placeholder="Email"
              error={errors.email?.message}
            />
            <FormInput
              {...register("password", {
                required: "Per favore inserisci la password",
              })}
              placeholder="Password"
              type="password"
              error={errors.password?.message}
            />
          </MainFormSection>
          <Button>Accedi</Button>
        </AuthForm>
        <ChangeAuthLink to={"/signup"}>
          Non hai un account? Registrati ora!
        </ChangeAuthLink>
      </AuthCard>
    </AuthLayoutContainer>
  );
}
