import { Button } from "@/components/ui/button";
import Modal from "./Modal";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
};
export default function DeleteUserModal({ isOpen, onClose, onSubmit }: Props) {
  return (
    <Modal isOpen={isOpen} onRequestClose={onClose} animate>
      {/* Why is this <h3>? Because the ResetTimetable.tsx uses h3 */}
      <h1 className="header">
        Do you want to remove the selected room(s) from the list?
      </h1>
      <p className="text-base my-5">
        The room is not permanently deleted, just removed from the list.
      </p>

      <Button variant="submit" onClick={onSubmit}>
        Delete
      </Button>
    </Modal>
  );
}
