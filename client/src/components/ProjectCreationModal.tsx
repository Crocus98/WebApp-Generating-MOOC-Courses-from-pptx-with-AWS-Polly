import React, { useState } from "react";
import Modal from "react-modal";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
};

export default function ProjectCreationModal({
  isOpen,
  onClose,
  children,
}: Props) {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      shouldCloseOnEsc={true}
      shouldCloseOnOverlayClick={true}
      style={{
        overlay: {
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        },
        content: {
          width: "min(calc(100vw - 80px), 500px)",
          border: "1px solid #ccc",
          background: "#fff",
          overflow: "auto",
          WebkitOverflowScrolling: "touch",
          borderRadius: "4px",
          outline: "none",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          position: "initial",
        },
      }}
    >
      {children}
    </Modal>
  );
}
