import { useEffect, useState, type FC } from "react";
import { useDispatch, useSelector } from "react-redux";
import classnames from "classnames";
import { UserPlus, User } from "react-feather";

import type { State } from "types/state";

import styles from "./Navtabs.scss";
import { apolloClient } from "views/timetable/TimetableContent";
import { gql } from "@apollo/client";
import { RoomUser, UserChange } from "types/timetables";
import { Action } from "actions/constants";
import { switchUser } from "actions/settings";
import store from "entry/main";
import { UserID } from "types/modules";

export const NAVTAB_HEIGHT = 48;

export const USER_CHANGE_SUBSCRIPTION = gql`
  subscription UserChange($roomID: String!) {
    userChange(roomID: $roomID) {
      action
      userID
      name
    }
  }
`;

export const CREATE_USER = gql`
  mutation CreateUser($roomID: String!) {
    createUser(roomID: $roomID)
  }
`;

const Navtabs: FC<{
  roomID: String;
}> = ({ roomID }) => {
  const activeSemester = useSelector(({ app }: State) => app.activeSemester);
  const activeUserID = useSelector(({ app }: State) => app.activeUserID);
  const beta = useSelector(({ settings }: State) => settings.beta);
  const dispatch = useDispatch();

  const [users, setUsers] = useState<RoomUser[]>([]);

  useEffect(() => {
    apolloClient
      .subscribe({
        query: USER_CHANGE_SUBSCRIPTION,
        variables: {
          roomID: roomID,
        },
      })
      .subscribe({
        next(data) {
          if (data.data) {
            const userChange: UserChange = data.data.userChange;
            const { action, userID, name } = userChange;

            switch (action) {
              case Action.CREATE_USER: {
                setUsers((users) => [...users, { userID, name }]);
                if (store.getState().app.activeUserID == -1) {
                  dispatch(switchUser(userID));
                }
                return;
              }
              case Action.UPDATE_USER: {
                setUsers((users) =>
                  users.map((user) => {
                    if (user.userID === userID) return { ...user, name: name };
                    return user;
                  })
                );
                return;
              }
              case Action.DELETE_USER: {
                setUsers((users) =>
                  users.filter((user) => user.userID !== userID)
                );
                return;
              }
            }
          }
        },
        error(error) {
          console.log("Apollo subscribe error", error);
        },
        complete() {},
      });
  }, [roomID]);

  const navUsers = users.map((user) => {
    return (
      <a
        key={user.userID}
        className={
          activeUserID === user.userID
            ? classnames(styles.link, styles.linkActive)
            : styles.link
        }
        onClick={(e) => {
          const userIDString = e.currentTarget.getAttribute("data-userid");
          if (userIDString) {
            const userID: UserID = +userIDString;
            dispatch(switchUser(userID));
          }
        }}
        data-userid={user.userID}
      >
        <User />
        <span className={styles.title}>{user.name}</span>
      </a>
    );
  });

  return (
    <nav className={styles.nav}>
      {navUsers}
      <a
        className={styles.link}
        aria-label="New User"
        onClick={() => {
          apolloClient
            .mutate({
              mutation: CREATE_USER,
              variables: {
                roomID: roomID,
              },
            })
            .catch((err) => {
              console.error("CREATE_USER error: ", err);
            });
        }}
      >
        <UserPlus />
        <span className={styles.title}>New User</span>
      </a>
      {/* <div className={styles.divider} /> */}
    </nav>
  );
};

export default Navtabs;
