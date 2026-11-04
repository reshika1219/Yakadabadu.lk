import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

const PickupConfirmationModal = ({ show, onConfirm, onCancel, onClose, mode }) => {
  const [formData, setFormData] = useState({
    weight: '',
    amount: '',
    reason: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!show) {
      // Reset form when modal closes
      setFormData({ weight: '', amount: '', reason: '' });
      setErrors({});
    }
  }, [show]);

  const validateForm = () => {
    const newErrors = {};
    
    if (mode === 'confirm') {
      if (!formData.weight.trim()) newErrors.weight = 'Weight is required';
      if (!formData.amount.trim()) newErrors.amount = 'Amount is required';
      if (!(parseFloat(formData.weight) > 0)) newErrors.weight = 'Enter a weight above 0';
      if (!(parseFloat(formData.amount) >= 0)) newErrors.amount = 'Enter an amount of 0 or more';
    } else if (mode === 'cancel') {
      if (!formData.reason.trim()) newErrors.reason = 'Reason is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (mode === 'confirm') {
      onConfirm({
        weight: parseFloat(formData.weight),
        amount: parseFloat(formData.amount),
      });
    } else {
      onCancel(formData.reason.trim());
    }
    onClose();
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  return (
    <Modal show={show} onHide={onClose} backdrop="static" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          {mode === 'confirm' ? 'Complete pickup' : 'Cancel pickup'}
        </Modal.Title>
      </Modal.Header>
      
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {mode === 'confirm' && (
            <>
              <Form.Group className="mb-3" controlId="modal-weight">
                <Form.Label>Total Weight (kg)</Form.Label>
                <Form.Control
                  type="number"
                  step="0.1"
                  placeholder="e.g. 7.5" autoFocus
                  value={formData.weight}
                  onChange={(e) => handleChange('weight', e.target.value)}
                  isInvalid={!!errors.weight}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.weight}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3" controlId="modal-amount">
                <Form.Label>Amount Given (LKR)</Form.Label>
                <Form.Control
                  type="number"
                  step="1"
                  placeholder="e.g. 1200"
                  value={formData.amount}
                  onChange={(e) => handleChange('amount', e.target.value)}
                  isInvalid={!!errors.amount}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.amount}
                </Form.Control.Feedback>
              </Form.Group>
            </>
          )}

          {mode === 'cancel' && (
            <Form.Group className="mb-3" controlId="modal-reason">
              <Form.Label>Reason for Cancellation</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Explain why you can't complete this pickup"
                value={formData.reason}
                onChange={(e) => handleChange('reason', e.target.value)}
                isInvalid={!!errors.reason}
              />
              <Form.Control.Feedback type="invalid">
                {errors.reason}
              </Form.Control.Feedback>
            </Form.Group>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="light" onClick={onClose}>
            Back
          </Button>
          <Button 
            variant={mode === 'confirm' ? 'success' : 'danger'}
            type="submit"
          >
            {mode === 'confirm' ? 'Mark as complete' : 'Cancel pickup'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default PickupConfirmationModal;