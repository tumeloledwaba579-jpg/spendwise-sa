'use client';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  sourceName: string;
  isDeleting: boolean;
}

export default function DeleteConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  sourceName,
  isDeleting 
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Ã°Å¸â€”â€˜Ã¯Â¸Â Delete Income Source</h2>
          <button className="modal-close" onClick={onClose}>Ãƒâ€”</button>
        </div>
        
        <div className="modal-step">
          <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>
            Are you sure you want to delete <strong>"{sourceName}"</strong>?
          </p>
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            This action cannot be undone. All income history for this source will also be deleted.
          </p>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="button" 
              className="btn-delete" 
              onClick={onConfirm}
              disabled={isDeleting}
              style={{ padding: '0.75rem 1.5rem' }}
            >
              {isDeleting ? 'Deleting...' : 'Ã°Å¸â€”â€˜Ã¯Â¸Â Delete Forever'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}