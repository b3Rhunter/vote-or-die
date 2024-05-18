import { useEffect } from 'react';
import PropTypes from 'prop-types';
import './Notification.css';

const Notification = ({ message, show, setShow }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        setShow(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, setShow]);

  return (
    <div className={`notification-container ${show ? 'show' : 'hide'}`}>
      <p>{message}</p>
    </div>
  );
};

Notification.propTypes = {
  message: PropTypes.string,
  show: PropTypes.func,
  setShow: PropTypes.func,
};

export default Notification;