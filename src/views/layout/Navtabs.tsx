import { useEffect, useState, MouseEvent, type FC } from "react";
import { useDispatch, useSelector } from "react-redux";
import classnames from "classnames";
import { UserPlus, User, Trash, Edit } from "react-feather";

import type { State } from "types/state";
import ContextMenu from "views/components/ContextMenu";

import styles from "./Navtabs.scss";
import { apolloClient } from "views/timetable/TimetableContent";
import { gql } from "@apollo/client";
import { RoomUser, UserChange } from "types/timetables";
import { Action } from "actions/constants";
import { switchUser } from "actions/settings";
import store from "entry/main";
import { UserID } from "types/modules";
import { ListItemIcon, ListItemText, MenuItem } from "@mui/material";
import RenameUserModal from "views/components/RenameUserModal";
import DeleteUserModal from "views/components/DeleteUserModal";
import { deleteTimetableUser } from "actions/timetables";

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

export const UPDATE_USER = gql`
  mutation UpdateUser($roomID: String!, $userID: Int!, $newname: String!) {
    updateUser(roomID: $roomID, userID: $userID, newname: $newname)
  }
`;

export const DELETE_USER = gql`
  mutation DeleteUser($roomID: String!, $userID: Int!) {
    deleteUser(roomID: $roomID, userID: $userID)
  }
`;

function updateUser(roomID: string, userID: number, newname: string) {
  apolloClient
    .mutate({
      mutation: UPDATE_USER,
      variables: {
        roomID: roomID,
        userID: userID,
        newname: newname,
      },
    })
    .catch((err) => {
      console.error("DELETE_USER: ", err);
      alert("Failed to update user");
    });
}

function deleteUser(roomID: string, userID: number) {
  apolloClient
    .mutate({
      mutation: DELETE_USER,
      variables: {
        roomID: roomID,
        userID: userID,
      },
    })
    .catch((err) => {
      console.error("DELETE_USER: ", err);
      alert("Failed to delete user");
    });
}

// TODO: move to a more appropriate location
function getActiveUserID(roomID: string) {
  return store.getState().app.activeUserMapping[roomID] ?? -1;
}

const Navtabs: FC<{
  roomID: string;
}> = ({ roomID }) => {
  const dispatch = useDispatch();

  const [users, setUsers] = useState<RoomUser[]>([]);
  const [contextMenuAnchor, setContextMenuAnchor] = useState<
    HTMLElement | undefined
  >(undefined);
  const [isRenameUserModalOpen, setIsRenameUserModalOpen] =
    useState<boolean>(false);
  const [isDelUserModalOpen, setIsDelUserModalOpen] = useState<boolean>(false);
  const [curEditUser, setCurEditUser] = useState<RoomUser | undefined>(
    undefined,
  );

  useEffect(() => {
    setUsers([]);

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
                if (getActiveUserID(roomID) === -1) {
                  dispatch(switchUser(userID, roomID));
                }
                return;
              }
              case Action.UPDATE_USER: {
                setUsers((users) =>
                  users.map((user) => {
                    if (user.userID === userID) return { ...user, name: name };
                    return user;
                  }),
                );
                return;
              }
              case Action.DELETE_USER: {
                setUsers((users) => {
                  const filteredUsers = users.filter((user) => user.userID !== userID);
                  // Switch to first user if current active user is deleted
                  if (filteredUsers.length > 0 && getActiveUserID(roomID) === userID)
                    dispatch(switchUser(filteredUsers[0].userID, roomID));
                  return filteredUsers;
                });
                dispatch(deleteTimetableUser(userID));
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

  function handleContextMenu(user: RoomUser) {
    return (e: MouseEvent<HTMLElement>) => {
      e.preventDefault();
      setContextMenuAnchor(e.currentTarget);
      setCurEditUser(user);
    };
  }

  function handleRenameUser(newName: string) {
    if (curEditUser !== undefined)
      updateUser(roomID.valueOf(), curEditUser.userID, newName);
    setIsRenameUserModalOpen(false);
  }

  function handleDeleteUser() {
    if (curEditUser != undefined)
      deleteUser(roomID.valueOf(), curEditUser.userID);
    setIsDelUserModalOpen(false);
  }

  const navUsers = users.map((user) => {
    return (
      <a
        key={user.userID}
        className={
          getActiveUserID(roomID) === user.userID
            ? classnames(styles.link, styles.linkActive)
            : styles.link
        }
        onContextMenu={handleContextMenu(user)}
        onClick={(e) => {
          const userIDString = e.currentTarget.getAttribute("data-userid");
          if (userIDString) {
            const userID: UserID = +userIDString;
            dispatch(switchUser(userID, roomID));
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
    <>
      <RenameUserModal
        isOpen={isRenameUserModalOpen}
        curEditUser={curEditUser}
        onClose={() => {
          setIsRenameUserModalOpen(false);
        }}
        onSubmit={handleRenameUser}
      />
      <DeleteUserModal
        isOpen={isDelUserModalOpen}
        curEditUser={curEditUser}
        onClose={() => {
          setIsDelUserModalOpen(false);
        }}
        onSubmit={handleDeleteUser}
      />
      <ContextMenu
        element={contextMenuAnchor}
        onClose={() => setContextMenuAnchor(undefined)}
      >
        {[
          <MenuItem
            key="rename"
            onClick={() => {
              setContextMenuAnchor(undefined);
              setIsRenameUserModalOpen(true);
            }}
          >
            <ListItemIcon>
              <Edit />
            </ListItemIcon>
            <ListItemText>Rename</ListItemText>
          </MenuItem>,
          <MenuItem
            disabled={users.length <= 1}
            key="delete"
            onClick={() => {
              setContextMenuAnchor(undefined);
              setIsDelUserModalOpen(true);
            }}
          >
            <ListItemIcon>
              <Trash />
            </ListItemIcon>
            <ListItemText>Remove</ListItemText>
          </MenuItem>,
        ]}
      </ContextMenu>
      <nav className={styles.nav}>
        <div>{navUsers}</div>
        <div className={styles.divider} />
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
      </nav>
    </>
  );
};

export default Navtabs;
