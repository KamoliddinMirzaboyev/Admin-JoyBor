import React from 'react';
import { XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ImageLightbox({ src, onClose }: { src: string | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {src && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            className="relative max-w-4xl max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute -top-10 right-0 text-white hover:text-surface-300 transition-colors duration-150"
            >
              <XCircle className="w-8 h-8" />
            </button>
            <img src={src} alt="Katta rasm" className="max-w-full max-h-[90vh] object-contain rounded-xl" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
