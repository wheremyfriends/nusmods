import { Redirect } from "react-router-dom";
import { generateRoomID, pageWithRoomID } from "views/routes/paths";
import React from "react";

export const CreateRoom = () => {
  return <Redirect to={pageWithRoomID(generateRoomID())} />;
};
