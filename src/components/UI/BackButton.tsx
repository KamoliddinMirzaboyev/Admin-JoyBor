import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Button from './Button';

interface BackButtonProps {
  label?: string;
  onClick?: () => void;
  className?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ label = 'Orqaga', onClick, className }) => {
  const navigate = useNavigate();
  return (
    <Button
      type="button"
      variant="secondary"
      onClick={onClick || (() => navigate(-1))}
      className={className}
      aria-label={label}
    >
      <ArrowLeft className="w-4 h-4" />
      <span>{label}</span>
    </Button>
  );
};

export default BackButton;
