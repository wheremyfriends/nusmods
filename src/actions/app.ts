import { NotificationOptions } from "types/reducers";
import { TimetableGeneratorConfig } from "types/timetables";

export const SET_ONLINE_STATUS = "SET_ONLINE_STATUS" as const;
export function setOnlineStatus(isOnline: boolean) {
  return {
    type: SET_ONLINE_STATUS,
    payload: { isOnline },
  };
}

export const TOGGLE_FEEDBACK_MODAL = "TOGGLE_FEEDBACK_MODAL" as const;
export function toggleFeedback() {
  return {
    type: TOGGLE_FEEDBACK_MODAL,
    payload: null,
  };
}

export const OPEN_NOTIFICATION = "OPEN_NOTIFICATION" as const;
export function openNotification(
  message: string,
  options: NotificationOptions = {},
) {
  return {
    type: OPEN_NOTIFICATION,
    payload: {
      message,
      ...options,
    },
  };
}

export const POP_NOTIFICATION = "POP_NOTIFICATION" as const;
export function popNotification() {
  return {
    type: POP_NOTIFICATION,
    payload: null,
  };
}

export const PROMPT_REFRESH = "PROMPT_REFRESH" as const;
export function promptRefresh() {
  return {
    type: PROMPT_REFRESH,
    payload: null,
  };
}

export const UPDATE_ROOM_LAST_ACCESSED = "UPDATE_ROOM_LAST_ACCESSED" as const;
export function updateRoomLastAccessed(roomID: string) {
  return {
    type: UPDATE_ROOM_LAST_ACCESSED,
    payload: {
      roomID,
    },
  };
}

export const REMOVE_ROOM = "REMOVE_ROOM" as const;
export function removeRoom(roomIDs: string[]) {
  return {
    type: REMOVE_ROOM,
    payload: {
      roomIDs,
    },
  };
}
