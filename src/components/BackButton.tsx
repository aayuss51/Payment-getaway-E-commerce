import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { motion } from 'motion/react';

interface BackButtonProps {
  className?: string;
  label?: string;
  to?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({ className = '', label = 'Back', to }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (to) {
      navigate(to);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <motion.button
      onClick={handleBack}
      className={`flex items-center gap-1 text-gray-500 transition-colors font-medium mb-6 ${className}`}
      whileHover={{ x: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      <ChevronLeft className="w-5 h-5" />
      <span>{label}</span>
    </motion.button>
  );
};



