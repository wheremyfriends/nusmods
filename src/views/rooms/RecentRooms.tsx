import React, { useContext, useEffect, useState } from "react";
import { DataTable } from "./DataTable";
import { Room, columns } from "./columns";
import { Button } from "@/components/ui/button";
import { Plus, Trash } from "react-feather";
import { useDispatch, useSelector } from "react-redux";
import { RowSelectionState } from "@tanstack/react-table";
import { State } from "types/state";
import RemoveRoomModal from "views/components/RemoveRoomModal";
import { removeRoom } from "actions/app";
import CreateRoomModal from "views/components/CreateRoomModal";
import { AuthContext } from "views/account/AuthContext";
import { getRooms } from "utils/graphql";
import { apolloClient } from "views/timetable/TimetableContent";

export default function RecentRooms() {
  const dispatch = useDispatch();
  const { user: authUser } = useContext(AuthContext);

  const activeUsers = useSelector(
    (state: State) => state.app.activeUserMapping,
  );

  const recentRooms = Object.entries(activeUsers).reduce(
    (acc, [roomID, { lastAccessed }]) => {
      acc[roomID] = new Date(lastAccessed);
      return acc;
    },
    {} as { [roomID: string]: Date },
  );

  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [isRemoveRoomModalOpen, setIsRemoveRoomModalOpen] =
    React.useState(false);
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] =
    React.useState(false);

  const [authRooms, setAuthRooms] = useState<Room[]>([]);
  useEffect(() => {
    getRooms(apolloClient).then((rooms) => {
      if (!rooms) return;
      setAuthRooms(
        rooms.map((r) => ({
          roomID: r,
          lastAccessed: recentRooms[r],
        })),
      );
    });
  }, [authUser]);

  const data: Room[] = Object.entries(activeUsers)
    .filter(([roomID, {}]) => !authRooms.map((r) => r.roomID).includes(roomID))
    .map(([roomID, { lastAccessed }]) => {
      return {
        roomID,
        lastAccessed: new Date(lastAccessed),
      };
    })
    .sort((a, b) => {
      return b.lastAccessed.valueOf() - a.lastAccessed.valueOf();
    });

  return (
    <main className="px-10 pb-10 pt-3 overflow-auto">
      <RemoveRoomModal
        isOpen={isRemoveRoomModalOpen}
        onClose={() => setIsRemoveRoomModalOpen(false)}
        onSubmit={() => {
          dispatch(removeRoom(Object.keys(rowSelection)));
          setIsRemoveRoomModalOpen(false);
        }}
      />
      <CreateRoomModal
        isOpen={isCreateRoomModalOpen}
        onClose={() => setIsCreateRoomModalOpen(false)}
        onSubmit={() => {
          setIsCreateRoomModalOpen(false);
        }}
      />
      <h1 className="header">Recent Rooms</h1>
      <p className="text-base">List of previously visited rooms</p>
      <div className="mb-5 flex gap-x-1">
        <Button hidden onClick={() => setIsCreateRoomModalOpen(true)}>
          <Plus />
          Join/Create room
        </Button>
        <Button
          variant="secondary"
          disabled={Boolean(Object.keys(rowSelection).length <= 0)}
          onClick={() => {
            setIsRemoveRoomModalOpen(true);
          }}
        >
          <Trash />
          Remove
        </Button>
      </div>
      {authUser && (
        <>
          <h2 className="header">Your rooms</h2>
          <DataTable
            columns={columns}
            data={authRooms}
            rowSelection={rowSelection}
            setRowSelection={setRowSelection}
          />
          <div className="mt-5"></div>
          <h2 className="header">Other Rooms</h2>
        </>
      )}
      <DataTable
        columns={columns}
        data={data}
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
      />
    </main>
  );
}
