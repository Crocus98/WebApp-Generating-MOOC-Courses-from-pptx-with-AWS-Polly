import React, { useContext, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import FormInput from "../components/FormInput";
import Button from "../components/Button";
import {
  AuthCard,
  AuthCardTitle,
  AuthForm,
  AuthLayoutContainer,
  ChangeAuthLink,
  ErrorText,
  MainFormSection,
} from "./Signup";
import { AuthActionType, AuthContext } from "../components/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

type Props = {};

type LoginForm = {
  email: string;
  password: string;
};

export default function Login({}: Props) {
  const [requestError, setRequestError] = useState<string | null>(null);
  const { dispatch } = useContext(AuthContext);
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    mode: "onSubmit",
  });

  const onSubmit: SubmitHandler<LoginForm> = async (data) => {
    setRequestError(null);
    const { email, password } = data;
    try {
      const loginResponse = await axios.post<{
        name: string;
        surname: string;
        token: string;
      }>("/v1/public/login", {
        email,
        password,
      });

      dispatch({
        type: AuthActionType.LOGIN,
        payload: {
          email,
          firstName: loginResponse.data.name,
          lastName: loginResponse.data.surname,
          token: loginResponse.data.token,
        },
      });
      navigate("/");
    } catch (err) {
      if (!axios.isAxiosError(err) || !err.response) {
        return setRequestError(
          "An error occurred while processing your request"
        );
      }
      if (typeof err.response.data === "string") {
        return setRequestError(err.response.data);
      } else {
        return setRequestError(err.message);
      }
    }
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
          {requestError && <ErrorText>{requestError}</ErrorText>}
          <Button>Accedi</Button>
        </AuthForm>
        <ChangeAuthLink to={"/signup"}>
          Non hai un account? Registrati ora!
        </ChangeAuthLink>
      </AuthCard>
    </AuthLayoutContainer>
  );
}
