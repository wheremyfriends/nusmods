import { useEffect, useState } from "react";
import CloseButton from "./CloseButton";
import Modal from "./Modal";
import { RoomUser } from "types/timetables";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  curEditUser: RoomUser | undefined;
  onSubmit: (newName: string) => void;
};

export default function RenameUserModal({
  isOpen,
  curEditUser,
  onClose,
  onSubmit,
}: Props) {
  const [newName, setNewName] = useState<string | undefined>(undefined);

  useEffect(() => {
    setNewName(curEditUser?.name.valueOf());
  }, [isOpen]);

  function handleSubmit() {
    if (newName === undefined) return;

    setNewName(undefined);
    onSubmit(newName);
  }

  return (
    <Modal isOpen={isOpen} onRequestClose={onClose} animate>
      <CloseButton absolutePositioned onClick={onClose} />

      <h3>Rename User</h3>
      <div className="form-group">
        <label htmlFor="inputNewName">New Name</label>
        <input
          autoFocus
          type="text"
          className="form-control"
          placeholder="Enter new name"
          value={newName}
          onChange={(e) => {
            setNewName(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
        />
      </div>

      <button
        type="button"
        className="btn btn-primary btn-block"
        onClick={handleSubmit}
      >
        Rename
      </button>
    </Modal>
  );
}
