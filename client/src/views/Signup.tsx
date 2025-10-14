import React, { useContext, useState } from "react";
import styled from "styled-components";
import Card from "../components/Card";
import { H2, P } from "../components/Text";
import { SubmitHandler, useForm } from "react-hook-form";
import FormInput from "../components/FormInput";
import Button from "../components/Button";
import { Link, useNavigate } from "react-router-dom";
import colors from "../style/colors";
import axios from "axios";
import { AuthActionType, AuthContext } from "../components/AuthContext";

type Props = {};

export const AuthLayoutContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 50px 0;
`;

export const AuthCardTitle = styled(H2)`
  margin-bottom: 30px;
`;

export const AuthCard = styled(Card)`
  max-width: calc(100vh - 40px);
  width: 600px;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px 0;
`;

export const AuthForm = styled.form`
  display: flex;
  flex: 1;
  flex-direction: column;
  width: 80%;
  gap: 20px;
`;

export const ChangeAuthLink = styled(Link)`
  margin-top: 20px;
  color: ${colors.black};
`;

export const MainFormSection = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  gap: 20px;
`;

export const ErrorText = styled(P)`
  color: ${colors.orange};
  margin: 10px 0;
  text-align: center;
`;

type SignupForm = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  accessToken: string;
};

export default function Signup({}: Props) {
  const [requestError, setRequestError] = useState<string | null>(null);
  const { dispatch } = useContext(AuthContext);
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignupForm>({
    mode: "onSubmit",
  });

  const onSubmit: SubmitHandler<SignupForm> = async (data) => {
    setRequestError(null);
    const {
      email,
      password,
      firstName,
      lastName,
      accessToken,
      confirmPassword,
    } = data;
    if (confirmPassword !== password) {
      return setError("confirmPassword", {
        type: "custom",
        message: "Le due password devono coincidere",
      });
    }

    try {
      await axios.post("/v1/public/register", {
        name: firstName,
        surname: lastName,
        email,
        password,
        token: accessToken,
      });
    } catch (err) {
      if (!axios.isAxiosError(err) || !err.response) {
        return setRequestError(
          "An error occurred while processing your request"
        );
      }

      if (err.response.data === "Invalid token") {
        return setError("accessToken", {
          type: "custom",
          message: "Token non valido",
        });
      } else if (err.response.data === "User already exists with this email") {
        return setError("email", {
          type: "custom",
          message:
            "Questa email è stata già utilizzata per registrare un account",
        });
      } else if (typeof err.response.data === "string") {
        return setRequestError(err.response.data);
      } else {
        return setRequestError(err.message);
      }
    }

    try {
      const loginResponse = await axios.post<{ token: string }>(
        "/v1/public/login",
        {
          email,
          password,
        }
      );
      dispatch({
        type: AuthActionType.LOGIN,
        payload: {
          firstName,
          lastName,
          email,
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
        <AuthCardTitle>Registrati</AuthCardTitle>
        <AuthForm onSubmit={handleSubmit(onSubmit)} noValidate>
          <MainFormSection>
            <FormInput
              {...register("firstName", {
                required: "Per favore inserisci il tuo nome",
              })}
              placeholder="Nome"
              error={errors.firstName?.message}
            />
            <FormInput
              {...register("lastName", {
                required: "Per favore inserisci il tuo cognome",
              })}
              placeholder="Cognome"
              error={errors.lastName?.message}
            />
            <FormInput
              {...register("email", {
                required: "Per favore inserisci un indirizzo email valido",
                pattern: {
                  value: /\S+@\S+\.\S+/,
                  message: "Per favore inserisci un indirizzo email valido",
                },
              })}
              placeholder="Email"
              error={errors.email?.message}
            />
            <FormInput
              {...register("password", {
                required: "Per favore inserisci la password",
                minLength: {
                  value: 8,
                  message: "La password deve essere lunga almeno 8 caratteri",
                },
              })}
              placeholder="Password"
              type="password"
              error={errors.password?.message}
            />
            <FormInput
              {...register("confirmPassword", {
                required: "Per favore reinserisci la password",
              })}
              placeholder="Confirm Password"
              type="password"
              error={errors.confirmPassword?.message}
            />
            <FormInput
              {...register("accessToken", {
                required: "Per favore inserisci il tuo Private Access Token",
              })}
              placeholder="Private Access Token"
              error={errors.accessToken?.message}
            />
          </MainFormSection>
          {requestError && <ErrorText>{requestError}</ErrorText>}
          <Button>Registrati</Button>
        </AuthForm>
        <ChangeAuthLink to={"/login"}>
          Hai già un account? Accedi
        </ChangeAuthLink>
      </AuthCard>
    </AuthLayoutContainer>
  );
}
