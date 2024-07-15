import { createContext } from "react";

export const RoomContext = createContext<{
  roomID: string | undefined;
  userID: number;
}>({
  roomID: undefined,
  userID: -1,
});
