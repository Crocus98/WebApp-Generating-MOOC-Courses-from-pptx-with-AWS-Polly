import React, { Dispatch, useReducer } from "react";

const initialState = {};

const AuthContext = React.createContext<{
  state: AuthState;
  dispatch: Dispatch<AuthAction>;
}>({ state: initialState, dispatch: () => null });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  return (
    <AuthContext.Provider value={{ state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
};

interface AuthState {
  name?: string;
  email?: string;
  token?: string;
}

enum AuthActionType {
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
}

interface LoginAction {
  type: AuthActionType.LOGIN;
  payload: AuthState;
}

interface LogoutAction {
  type: AuthActionType.LOGOUT;
}

type AuthAction = LoginAction | LogoutAction;

function authReducer(state: AuthState, action: AuthAction) {
  switch (action.type) {
    case AuthActionType.LOGIN:
      return {
        ...state,
        name: action.payload.name,
        email: action.payload.email,
        token: action.payload.token,
      };
    case AuthActionType.LOGOUT:
      return {};

    default:
      return state;
  }
}
