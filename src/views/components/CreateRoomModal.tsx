import { useEffect, useState } from "react";
import Modal from "./Modal";
import Input from "./Input";
import { Button } from "@/components/ui/button";
import { useHistory } from "react-router-dom";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newName: string) => void;
};

export default function RenameUserModal({ isOpen, onClose, onSubmit }: Props) {
  const [name, setName] = useState<string>("");
  const history = useHistory();

  function handleSubmit() {
    if (name === "") history.push("/");
    else history.push(`/${name}`);
  }

  return (
    <Modal isOpen={isOpen} onRequestClose={onClose} animate>
      <h1 className="header">Create Room</h1>
      <Input
        label="Room Name"
        helperText="Leave blank for random name"
        autoFocus
        type="text"
        className="form-control"
        placeholder="Enter new name"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
        }}
        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key === "Enter") handleSubmit();
        }}
      />

      <Button variant="submit" className="mt-5" onClick={handleSubmit}>
        Create
      </Button>
    </Modal>
  );
}
