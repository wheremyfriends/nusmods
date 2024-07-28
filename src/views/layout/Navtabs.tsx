import { useEffect, useState, MouseEvent, type FC, useContext } from "react";
import { useDispatch, useSelector } from "react-redux";
import classnames from "classnames";
import { UserPlus, User, Trash, Edit } from "react-feather";

import type { State } from "types/state";
import ContextMenu from "views/components/ContextMenu";

import styles from "./Navtabs.scss";
import { apolloClient } from "views/timetable/TimetableContent";
import { ApolloClient, gql } from "@apollo/client";
import { RoomUser, UserChange } from "types/timetables";
import { Action } from "actions/constants";
import { switchUser } from "actions/settings";
import store from "entry/main";
import { UserID } from "types/modules";
import { ListItemIcon, ListItemText, MenuItem } from "@mui/material";
import RenameUserModal from "views/components/RenameUserModal";
import DeleteUserModal from "views/components/DeleteUserModal";
import { deleteTimetableUser } from "actions/timetables";
import { updateRoomLastAccessed } from "actions/app";
import {
  createUser,
  deleteUser,
  joinRoom,
  subscribeToUserChanges,
} from "utils/graphql";
import { cn } from "@/lib/utils";
import { AuthContext } from "views/account/AuthContext";
import { Button } from "@/components/ui/button";

export const NAVTAB_HEIGHT = 48;

export const UPDATE_USER = gql`
  mutation UpdateUser($roomID: String!, $userID: Int!, $newname: String!) {
    updateUser(roomID: $roomID, userID: $userID, newname: $newname)
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

// TODO: move to a more appropriate location
function getActiveUserID(roomID: string) {
  return store.getState().app.activeUserMapping[roomID]?.user?.userID ?? -1;
}

const Navtabs: FC<{
  roomID: string;
}> = ({ roomID }) => {
  const { user: authUser } = useContext(AuthContext);

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

    const sub = subscribeToUserChanges(apolloClient, roomID, (userChange) => {
      const { action, ...curUser } = userChange;

      switch (action) {
        case Action.CREATE_USER: {
          setUsers((users) => [...users, curUser]);
          if (getActiveUserID(roomID) === -1) {
            dispatch(switchUser(curUser, roomID));
          }
          return;
        }
        case Action.UPDATE_USER: {
          setUsers((users) =>
            users.map((user) => {
              if (user.userID === curUser.userID) return curUser;
              return user;
            }),
          );
          return;
        }
        case Action.DELETE_USER: {
          setUsers((users) => {
            const filteredUsers = users.filter(
              (user) => user.userID !== curUser.userID,
            );
            // Switch to first user if current active user is deleted
            if (
              filteredUsers.length > 0 &&
              getActiveUserID(roomID) === curUser.userID
            )
              dispatch(switchUser(filteredUsers[0], roomID));
            return filteredUsers;
          });
          dispatch(deleteTimetableUser(curUser.userID));
          return;
        }
      }
    });

    dispatch(updateRoomLastAccessed(roomID));

    return () => sub.unsubscribe();
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

  async function handleDeleteUser() {
    if (curEditUser != undefined)
      await deleteUser(apolloClient, roomID.valueOf(), curEditUser.userID);
    setIsDelUserModalOpen(false);
  }

  function handleSwitchUser(user: RoomUser) {
    return (e: React.MouseEvent<HTMLAnchorElement, globalThis.MouseEvent>) => {
      dispatch(switchUser(user, roomID));
    };
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
        onClick={handleSwitchUser(user)}
      >
        <User className="shrink-0" />
        <span className={cn("truncate", styles.title)}>{user.name}</span>
        {authUser?.userID === user.userID && <span>(You)</span>}
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
      <nav className={cn("flex flex-col justify-start h-full")}>
        {authUser &&
          (users.map((u) => u.userID).includes(authUser.userID) ? (
            <Button
              className="mx-[2rem]"
              variant="danger"
              onClick={async () => {
                await deleteUser(apolloClient, roomID, authUser.userID);
              }}
            >
              Leave
            </Button>
          ) : (
            <Button
              className="mx-[2rem]"
              variant="success"
              onClick={async () => {
                await joinRoom(apolloClient, roomID);
              }}
            >
              Join
            </Button>
          ))}
        <div className="overflow-auto">{navUsers}</div>
        <div className={styles.divider} />
        <a
          className={styles.link}
          aria-label="New User"
          onClick={async () => {
            await createUser(apolloClient, roomID);
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
