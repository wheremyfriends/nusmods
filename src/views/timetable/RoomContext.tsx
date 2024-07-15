import { createContext } from "react";

export const RoomContext = createContext<{
  roomID: string | undefined;
  userID: number;
  readOnly: boolean;
}>({
  roomID: undefined,
  userID: -1,
  readOnly: false,
});
