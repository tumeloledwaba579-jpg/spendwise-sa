'use client';

import React from 'react';

interface TestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TestModal({ isOpen, onClose }: TestModalProps) {
  console.log('ÃƒÂ°Ã…Â¸Ã…Â½Ã‚Â¯ TestModal rendering, isOpen:', isOpen);
  
  if (!isOpen) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      backdropFilter: 'blur(5px)'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '20px',
        maxWidth: '500px',
        width: '90%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        animation: 'slideUp 0.3s ease'
      }}>
        <h2 style={{
          fontSize: '2rem',
          fontWeight: 700,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '20px'
        }}>
          ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Test Modal Working!
        </h2>
        
        <p style={{
          fontSize: '1.2rem',
          color: '#333',
          marginBottom: '30px',
          lineHeight: '1.6'
        }}>
          If you can see this, modals are working correctly in your application!
        </p>
        
        <div style={{
          backgroundColor: '#f3f4f6',
          padding: '15px',
          borderRadius: '10px',
          marginBottom: '30px',
          fontFamily: 'monospace',
          fontSize: '0.9rem'
        }}>
          <div>ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã‚Â Component: TestModal.tsx</div>
          <div>ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂÃ‚Â§ Props: isOpen={String(isOpen)}</div>
          <div>ÃƒÂ°Ã…Â¸Ã¢â‚¬Â¢Ã¢â‚¬â„¢ Time: {new Date().toLocaleTimeString()}</div>
        </div>
        
        <button
          onClick={() => {
            console.log('ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂÃ‚Â´ Test modal closing');
            onClose();
          }}
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            padding: '12px 30px',
            borderRadius: '10px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'transform 0.2s',
            width: '100%'
          }}
          onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          Close Modal
        </button>
      </div>
    </div>
  );
}

// Add keyframe animation to document
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
  document.head.appendChild(style);
}