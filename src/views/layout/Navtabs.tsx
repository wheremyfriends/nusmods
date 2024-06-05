import { useEffect, useState, type FC } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';
import classnames from 'classnames';
import {
  BookOpen,
  Calendar,
  Clock,
  Heart,
  Map,
  UserPlus,
  Settings,
  Star,
  Target,
  Trello,
  User,
} from 'react-feather';

import { showCPExTab } from 'featureFlags';
import ExternalLink from 'views/components/ExternalLink';
import { pageWithRoomID, timetablePage } from 'views/routes/paths';
import type { State } from 'types/state';

import styles from './Navtabs.scss';
import { apolloClient } from 'views/timetable/TimetableContent';
import { gql } from '@apollo/client';
import { RoomUser, UserChange } from 'types/timetables';
import { Action } from 'actions/constants';
import { switchUser } from 'actions/settings';
import store from 'entry/main';

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
                setUsers(users => [...users, { userID, name }]);
                const activeUserID = store.getState().app.activeUserID;
                if (!activeUserID) {
                  dispatch(switchUser(userID));
                }
                return;
              }
              case Action.UPDATE_USER: {
                setUsers(users => {
                  const index = users.findIndex(user => user.userID === userID);
                  if (index !== -1) {
                    users[index].name = name;
                  }
                  return users;
                });
                return;
              }
              case Action.DELETE_USER: {
                setUsers(users => users.filter((user) => user.userID == userID));
                return;
              }
            }
          }
        },
        error(error) {
          console.log("Apollo subscribe error", error);
        },
        complete() {
        },
      })
  }, [roomID]);

  const tabProps = {
    className: styles.link,
    activeClassName: styles.linkActive, // TODO: active for current user
  };

  const navUsers = users.map((user) => {

    return <a
    key={user.userID}
    className={styles.link}
    onClick={(e) => {
      const userID = Number(e.currentTarget.getAttribute('data-userid'));
      dispatch(switchUser(userID));
    }}
    data-userid={user.userID}
    >
      <User />
      <span className={styles.title}>{user.name}</span>
    </a>
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
              }
            })
            .catch((err) => {
              console.error("CREATE_USER error: ", err)
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
