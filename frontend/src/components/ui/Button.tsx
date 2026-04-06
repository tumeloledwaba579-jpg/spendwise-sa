'use client';

import React from 'react';
import './Button.css';

interface ButtonProps {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'outline' | 'text';
    size?: 'small' | 'medium' | 'large';
    onClick?: () => void;
    disabled?: boolean;
    fullWidth?: boolean;
    icon?: string;
    className?: string;
    type?: 'button' | 'submit' | 'reset';
}

export default function Button({
    children,
    variant = 'primary',
    size = 'medium',
    onClick,
    disabled = false,
    fullWidth = false,
    icon,
    className = '',
    type = 'button',
}: ButtonProps) {
    const variantClass = `btn-${variant}`;
    const sizeClass = `btn-${size}`;
    const widthClass = fullWidth ? 'btn-full-width' : '';

    return (
        <button
            type={type}
            className={`btn ${variantClass} ${sizeClass} ${widthClass} ${className}`}
            onClick={onClick}
            disabled={disabled}
        >
            {icon && <span className="material-symbols-outlined btn-icon">{icon}</span>}
            {children}
        </button>
    );
}