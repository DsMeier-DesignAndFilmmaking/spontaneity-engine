/**
 * LeadGenCTA.tsx
 * Lead generation CTA component (UI only).
 * 
 * Visual-only component with placeholder form modal.
 * Does not connect to backend or modify any existing functionality.
 */

import React, { useState } from 'react';

/**
 * LeadGenCTA component - Lead generation call-to-action.
 * 
 * UI-only: Displays placeholder form modal, does not submit data.
 */
export default function LeadGenCTA() {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // UI-only - no backend submission
    alert('This is a placeholder form. In production, this would submit to your API.');
    setShowModal(false);
    setFormData({ name: '', email: '', company: '' });
  };

  return (
    <>
      <div style={styles.container}>
        <p style={styles.text}>
          Interested in embedding this widget in your product?
        </p>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          style={styles.button}
          aria-label="Request API Access"
        >
          Request API Access
        </button>
      </div>

      {showModal && (
        <>
          <div
            style={styles.backdrop}
            onClick={() => setShowModal(false)}
            aria-hidden="true"
          />
          <div style={styles.modal} role="dialog" aria-modal="true" aria-labelledby="api-access-title">
            <div style={styles.modalHeader}>
              <h3 id="api-access-title" style={styles.modalTitle}>Request API Access</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={styles.closeButton}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label htmlFor="api-name" style={styles.label}>
                  Name
                </label>
                <input
                  id="api-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={styles.input}
                  placeholder="Your name"
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label htmlFor="api-email" style={styles.label}>
                  Email
                </label>
                <input
                  id="api-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={styles.input}
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label htmlFor="api-company" style={styles.label}>
                  Company
                </label>
                <input
                  id="api-company"
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  style={styles.input}
                  placeholder="Company name"
                />
              </div>
              <div style={styles.formActions}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
                <button type="submit" style={styles.submitButton}>
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    marginTop: '4rem',
    padding: '2rem',
    textAlign: 'center',
  },
  text: {
    fontSize: '1rem',
    color: '#6b7280',
    margin: 0,
  },
  button: {
    padding: '0.75rem 1.5rem',
    fontSize: '0.9375rem',
    fontWeight: '600',
    backgroundColor: '#667eea',
    color: '#ffffff',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none',
  },
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  modal: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: '#ffffff',
    borderRadius: '0.75rem',
    padding: '1.5rem',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    zIndex: 1001,
    maxWidth: '400px',
    width: '90%',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  modalTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    margin: 0,
    color: '#111827',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    lineHeight: '1',
    color: '#6b7280',
    cursor: 'pointer',
    padding: '0.25rem',
    borderRadius: '0.25rem',
    outline: 'none',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    padding: '0.75rem',
    fontSize: '0.9375rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.5rem',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  formActions: {
    display: 'flex',
    gap: '0.75rem',
    marginTop: '0.5rem',
  },
  cancelButton: {
    flex: 1,
    padding: '0.75rem',
    fontSize: '0.9375rem',
    fontWeight: '600',
    backgroundColor: 'transparent',
    color: '#6b7280',
    border: '1px solid #d1d5db',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    outline: 'none',
  },
  submitButton: {
    flex: 1,
    padding: '0.75rem',
    fontSize: '0.9375rem',
    fontWeight: '600',
    backgroundColor: '#667eea',
    color: '#ffffff',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    outline: 'none',
  },
};

// Add hover effects
if (typeof document !== 'undefined') {
  const styleId = 'lead-gen-cta-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      button[aria-label="Request API Access"]:hover {
        background-color: #5568d3 !important;
        transform: translateY(-1px);
      }
      input:focus {
        border-color: #667eea !important;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
      }
      button[aria-label="Close modal"]:hover {
        background-color: #f3f4f6 !important;
      }
    `;
    if (document.head) {
      document.head.appendChild(style);
    }
  }
}

