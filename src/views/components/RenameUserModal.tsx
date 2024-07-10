import { useEffect, useState } from "react";
import CloseButton from "./CloseButton";
import Modal from "./Modal";
import { RoomUser } from "types/timetables";
import Input from "./Input";
import { Button } from "@/components/ui/button";

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

      <h1 className="header">Rename User</h1>
      <Input
        label="New Name"
        autoFocus
        type="text"
        className="form-control"
        placeholder="Enter new name"
        value={newName}
        onChange={(e) => {
          setNewName(e.target.value);
        }}
        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key === "Enter") handleSubmit();
        }}
      />

      <Button variant="submit" className="mt-5" onClick={handleSubmit}>
        Rename
      </Button>
    </Modal>
  );
}
