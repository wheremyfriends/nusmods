import { Button } from "@/components/ui/button";
import Modal from "./Modal";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
};
export default function LeaveRoomModal({ isOpen, onClose, onSubmit }: Props) {
  return (
    <Modal isOpen={isOpen} onRequestClose={onClose} animate>
      <h1 className="header">Do you want to leave the selected room(s)?</h1>
      <p className="text-base my-5">This action cannot be undone</p>

      <Button variant="submit" onClick={onSubmit}>
        Leave
      </Button>
    </Modal>
  );
}
