import { Dispatch, SetStateAction, createContext } from "react";
import { AuthUser } from "types/accounts";

export const AuthContext = createContext<{
  user: AuthUser;
  setUser: Dispatch<SetStateAction<AuthUser>>;
}>({
  user: undefined,
  setUser: () => {},
});
