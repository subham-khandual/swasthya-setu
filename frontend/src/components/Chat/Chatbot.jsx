import React, { useState } from 'react';
import { Modal } from 'react-bootstrap';
import chatbot from "../assets/interactional-dialogue.png";
import Chat from './SuuSri/SuuSri';

const ChatBot = () => {
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  return (
    <>
      {/* Chat Bot Icon */}
      <div className="chat-bot-icon" onClick={handleShow}>
        <span>SuuSri</span>
      </div>

      {/* Bootstrap Modal */}
      <Modal show={show} onHide={handleClose} centered className="custom-modal">
        <Modal.Header closeButton className="modal-header-custom">
          {/* Remove the close button text */}
        </Modal.Header>
        <Modal.Body className="modal-body-custom" style={{ padding: '0', height: '80vh', maxHeight: '700px', minHeight: '400px' }}>
          <Chat />
        </Modal.Body>
      </Modal>
    </>
  );
};

export default ChatBot;
