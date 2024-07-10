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
      <h1 className="header">Do you want to remove the selected room(s)?</h1>
      <p className="text-base">It will only delete for you</p>

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
