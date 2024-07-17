import React from "react";
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

export default function RecentRooms() {
  const dispatch = useDispatch();

  const activeUsers = useSelector(
    (state: State) => state.app.activeUserMapping,
  );

  const data: Room[] = Object.entries(activeUsers)
    .map(([roomID, { userID, lastAccessed }]) => {
      return {
        roomID,
        lastAccessed: new Date(lastAccessed),
      };
    })
    .sort((a, b) => {
      return b.lastAccessed.valueOf() - a.lastAccessed.valueOf();
    });

  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [isRemoveRoomModalOpen, setIsRemoveRoomModalOpen] =
    React.useState(false);
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] =
    React.useState(false);

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
        <Button onClick={() => setIsCreateRoomModalOpen(true)}>
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
      <DataTable
        columns={columns}
        data={data}
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
      />
    </main>
  );
}
