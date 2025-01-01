import { useEffect, useState, type FC, useContext } from "react";
import { useDispatch } from "react-redux";
import classnames from "classnames";
import { UserPlus, User, Trash, Edit } from "react-feather";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

import styles from "./Navtabs.scss";
import { apolloClient } from "utils/graphql";
import { gql } from "@apollo/client";
import { RoomUser } from "types/timetables";
import { Action } from "actions/constants";
import { switchUser } from "actions/settings";
import store from "entry/main";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

  const [users, setUsers] = useState<{ [key: number]: RoomUser }>([]);
  // const [contextMenuAnchor, setContextMenuAnchor] = useState<
  //   HTMLElement | undefined
  // >(undefined);
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
          setUsers((users) => {
            return { ...users, [curUser.userID]: curUser };
          });
          if (getActiveUserID(roomID) === -1) {
            dispatch(switchUser(curUser, roomID));
          }
          return;
        }
        case Action.UPDATE_USER: {
          setUsers((users) => {
            return { ...users, [curUser.userID]: curUser };
          });
          return;
        }
        case Action.DELETE_USER: {
          setUsers((users) => {
            const { [curUser.userID]: user, ...filteredUsers } = users;
            // const filteredUsers = users.filter(
            //   (user) => user.userID !== curUser.userID,
            // );

            // Switch to first user if current active user is deleted
            if (
              Object.keys(filteredUsers).length > 0 &&
              getActiveUserID(roomID) === curUser.userID
            )
              dispatch(switchUser(Object.values(filteredUsers)[0], roomID));
            return filteredUsers;
          });
          // dispatch(deleteTimetableUser(curUser.userID));
          return;
        }
      }
    });

    dispatch(updateRoomLastAccessed(roomID));

    return () => sub.unsubscribe();
  }, [roomID]);

  // function handleContextMenu(user: RoomUser) {
  //   return (e: MouseEvent<HTMLElement>) => {
  //     e.preventDefault();
  //     setContextMenuAnchor(e.currentTarget);
  //     setCurEditUser(user);
  //   };
  // }

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
    return (_: React.MouseEvent<HTMLAnchorElement, globalThis.MouseEvent>) => {
      dispatch(switchUser(user, roomID));
    };
  }

  const navUsers = Object.values(users).map((user) => {
    return (
      <ContextMenu>
        <ContextMenuTrigger>
          <a
            key={user.userID}
            className={
              getActiveUserID(roomID) === user.userID
                ? classnames(styles.link, styles.linkActive)
                : styles.link
            }
            // onContextMenu={handleContextMenu(user)}
            onClick={handleSwitchUser(user)}
          >
            <User className="shrink-0" />
            <span className={cn("truncate", styles.title)}>{user.name}</span>
            {authUser?.userID === user.userID && <span>(You)</span>}
          </a>
        </ContextMenuTrigger>
        <ContextMenuContent className="z-[100000]">
          <ContextMenuItem
            onClick={() => {
              setIsRenameUserModalOpen(true);
              setCurEditUser(user);
            }}
          >
            <div className="flex gap-x-1 items-center">
              <Edit />
              Rename
            </div>
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => {
              setIsDelUserModalOpen(true);
              setCurEditUser(user);
            }}
          >
            <div className="flex gap-x-1 items-center">
              <Trash />
              Delete
            </div>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
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
      {/*<ContextMenu
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
            disabled={Object.keys(users).length <= 1}
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
      </ContextMenu> */}
      <nav className={cn("flex flex-col justify-start h-full")}>
        {authUser &&
          (Object.values(users)
            .map((u) => u.userID)
            .includes(authUser.userID) ? (
            <Button
              className="mx-[2rem] my-3"
              variant="danger"
              onClick={async () => {
                await deleteUser(apolloClient, roomID, authUser.userID);
              }}
            >
              Leave
            </Button>
          ) : (
            <Button
              className="mx-[2rem] my-3"
              variant="success"
              onClick={async () => {
                await joinRoom(apolloClient, roomID);
              }}
            >
              Join
            </Button>
          ))}

        {/* Mobile View */}
        <div className="flex gap-x-1 mx-[2rem] mb-2 md:hidden">
          <Button
            variant="success"
            className="flex-1"
            onClick={async () => {
              let user = await createUser(apolloClient, roomID);
              dispatch(switchUser(user, roomID));
            }}
          >
            Add
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => {
              setIsRenameUserModalOpen(true);
              setCurEditUser(users[getActiveUserID(roomID)]);
            }}
          >
            Rename
          </Button>
          <Button
            className="flex-1"
            variant="danger"
            onClick={() => {
              setIsDelUserModalOpen(true);
              setCurEditUser(users[getActiveUserID(roomID)]);
            }}
          >
            Delete
          </Button>
        </div>
        <Select
          onValueChange={(userID) => {
            dispatch(switchUser(users[parseInt(userID)], roomID));
          }}
          value={String(getActiveUserID(roomID))}
        >
          <SelectTrigger className="mx-[2rem] flex md:hidden">
            <SelectValue className="truncate" />
          </SelectTrigger>
          <SelectContent className="w-[90vw]">
            <SelectGroup>
              {Object.values(users).map((user) => (
                <SelectItem key={user.userID} value={String(user.userID)}>
                  {user.name +
                    (user.userID === authUser?.userID ? " (You)" : "")}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <div className="overflow-auto hidden md:block">{navUsers}</div>
        <div className={cn(styles.divider, "hidden md:block")} />
        <a
          className={cn(styles.link, "hidden md:block")}
          aria-label="New User"
          onClick={async () => {
            let user = await createUser(apolloClient, roomID);
            dispatch(switchUser(user, roomID));
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
