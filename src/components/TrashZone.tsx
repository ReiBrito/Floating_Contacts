import React from 'react';
import { Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function TrashZone({ isVisible, isHovered }: { isVisible: boolean; isHovered: boolean }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className={`fixed bottom-0 left-0 right-0 h-32 flex items-center justify-center transition-colors duration-300 z-0 ${
            isHovered ? 'bg-red-500/20' : 'bg-gradient-to-t from-red-500/10 to-transparent'
          }`}
        >
          <div className={`p-4 rounded-full transition-transform duration-300 ${isHovered ? 'scale-125 bg-red-500 text-white shadow-lg shadow-red-500/50' : 'bg-white/50 dark:bg-gray-800/50 text-red-500'}`}>
            <Trash2 size={32} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
