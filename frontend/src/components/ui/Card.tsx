'use client';

import React from 'react';
import './Card.css';

interface CardProps {
    children: React.ReactNode;
    variant?: 'default' | 'elevated' | 'outlined';
    padding?: 'none' | 'small' | 'medium' | 'large';
    className?: string;
    onClick?: () => void;
}

export default function Card({
    children,
    variant = 'default',
    padding = 'medium',
    className = '',
    onClick,
}: CardProps) {
    const variantClass = `card-${variant}`;
    const paddingClass = `card-padding-${padding}`;
    const clickableClass = onClick ? 'card-clickable' : '';

    return (
        <div
            className={`card ${variantClass} ${paddingClass} ${clickableClass} ${className}`}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
        >
            {children}
        </div>
    );
}