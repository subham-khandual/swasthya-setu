import React, { useState } from 'react';
import { Modal } from 'react-bootstrap';
import chatbot from "../assets/interactional-dialogue.png";
import Chat from './Sayraa/Sayraa';

const ChatBot = () => {
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  return (
    <>
      {/* Chat Bot Icon */}
      <div className="chat-bot-icon" onClick={handleShow}>
        <span>Sayraa</span>
      </div>

      {/* Bootstrap Modal */}
      <Modal show={show} onHide={handleClose} centered className="custom-modal">
        <Modal.Body className="modal-body-custom" style={{ padding: '0', height: '80vh', maxHeight: '720px', minHeight: '440px' }}>
          <Chat isFloating={true} onClose={handleClose} />
        </Modal.Body>
      </Modal>
    </>
  );
};

export default ChatBot;
