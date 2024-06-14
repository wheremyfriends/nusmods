import { RoomUser } from "types/timetables";
import CloseButton from "./CloseButton";
import Modal from "./Modal";

type Props = {
  isOpen: boolean;
  curEditUser: RoomUser | undefined;
  onClose: () => void;
  onSubmit: () => void;
};
export default function DeleteUserModal({
  isOpen,
  curEditUser,
  onClose,
  onSubmit,
}: Props) {
  return (
    <Modal isOpen={isOpen} onRequestClose={onClose} animate>
      <CloseButton absolutePositioned onClick={onClose} />

      {/* Why is this <h3>? Because the ResetTimetable.tsx uses h3 */}
      <h3>Are you sure you want to delete "{curEditUser?.name}"</h3>
      <p>This action cannot be undone</p>

      <button
        type="button"
        className="btn btn-primary btn-block"
        onClick={onSubmit}
      >
        Delete
      </button>
    </Modal>
  );
}
