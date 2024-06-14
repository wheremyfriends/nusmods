import React from "react";
import Menu from "@mui/material/Menu";
import Fade from "@mui/material/Fade";

type ContextMenuProps = {
  element: HTMLElement | undefined;
  onClose:
    | ((event: {}, reason: "backdropClick" | "escapeKeyDown") => void)
    | undefined;
  children: React.JSX.Element[];
};

export default function ContextMenu({
  element,
  onClose,
  children,
}: ContextMenuProps) {
  const open = Boolean(element);

  return (
    <Menu
      anchorEl={element}
      open={open}
      onClose={onClose}
      TransitionComponent={Fade}
    >
      {children}
    </Menu>
  );
}
