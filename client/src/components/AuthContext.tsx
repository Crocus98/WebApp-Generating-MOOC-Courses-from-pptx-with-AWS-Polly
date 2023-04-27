import axios from "axios";
import React, { Dispatch, useEffect, useReducer, useState } from "react";

const initialState = {};

const LOCAL_STORAGE_KEY = "AUTH";

interface LoggedAuthState {
  firstName: string;
  lastName: string;
  email: string;
  token: string;
}

interface AnonymousAuthState {}

type AuthState = LoggedAuthState | AnonymousAuthState;

export function isAuthenticated(state: AuthState): state is LoggedAuthState {
  return state.hasOwnProperty("token");
}

export enum AuthActionType {
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
}

interface LoginAction {
  type: AuthActionType.LOGIN;
  payload: LoggedAuthState;
}

interface LogoutAction {
  type: AuthActionType.LOGOUT;
}

type AuthAction = LoginAction | LogoutAction;

function authReducer(state: AuthState, action: AuthAction) {
  switch (action.type) {
    case AuthActionType.LOGIN:
      axios.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${action.payload.token}`;
      const authState = {
        ...state,
        firstName: action.payload.firstName,
        lastName: action.payload.lastName,
        email: action.payload.email,
        token: action.payload.token,
      };
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(authState));
      } catch (e) {
        console.log(e);
      }
      return authState;
    case AuthActionType.LOGOUT:
      delete axios.defaults.headers.common["Authorization"];
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      return {};

    default:
      return state;
  }
}

export const AuthContext = React.createContext<{
  state: AuthState;
  dispatch: Dispatch<AuthAction>;
}>({ state: initialState, dispatch: () => null });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [loading, setLoading] = useState(true);
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const persistedState = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (persistedState) {
      dispatch({
        type: AuthActionType.LOGIN,
        payload: JSON.parse(persistedState),
      });
    } else {
      dispatch({ type: AuthActionType.LOGOUT });
    }
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ state, dispatch }}>
      {loading ? null : children}
    </AuthContext.Provider>
  );
};
