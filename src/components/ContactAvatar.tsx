import React, { useEffect, useRef } from 'react';
import { Contact } from '../types';
import { motion, useMotionValue } from 'motion/react';

interface Props {
  key?: React.Key;
  contact: Contact;
  velocity?: { x: number; y: number };
  onUpdatePosition?: (id: number, x: number, y: number) => void;
  onClick: (contact: Contact) => void;
  onDoubleClick: (contact: Contact) => void;
  onDragStart: () => void;
  onDragEnd: (id: number, x: number, y: number, velocity: { x: number; y: number }) => void | Promise<void>;
}

export function ContactAvatar({ contact, onClick, onDoubleClick, onDragStart, onDragEnd, onUpdatePosition, velocity }: Props) {
  const x = useMotionValue(contact.pos_x);
  const y = useMotionValue(contact.pos_y);
  const rotate = useMotionValue(0);
  const scaleX = useMotionValue(1);
  const scaleY = useMotionValue(1);
  const isDragging = useRef(false);
  const clickTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Update motion values if props change (e.g. from server/physics)
  useEffect(() => {
    x.set(contact.pos_x);
    y.set(contact.pos_y);
    
    if (velocity && !isDragging.current) {
      const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
      
      // Rolling effect: rotate based on horizontal movement
      // 1 full rotation (360deg) for every ~300px moved (circumference of 96px circle is ~300px)
      // We accumulate rotation over time or just use a simple mapping for now
      // Since we don't have accumulated distance, let's just tilt it based on velocity
      const angle = Math.atan2(velocity.y, velocity.x) * (180 / Math.PI);
      
      // If speed is low, reset rotation slowly
      if (speed < 0.1) {
        rotate.set(0);
      } else {
        // Subtle tilt towards movement + a bit of "rolling" look
        rotate.set(angle);
      }
      
      // Stretch based on speed (squash and stretch)
      const stretch = Math.min(speed * 0.03, 0.3);
      scaleX.set(1 + stretch);
      scaleY.set(1 - stretch * 0.4);
    } else if (!isDragging.current) {
      rotate.set(0);
      scaleX.set(1);
      scaleY.set(1);
    }
  }, [contact.pos_x, contact.pos_y, x, y, velocity, rotate, scaleX, scaleY]);

  const handlePointerDown = () => {
    isDragging.current = false;
  };

  const handleDragStart = () => {
    isDragging.current = true;
    onDragStart();
    rotate.set(0);
    scaleX.set(1.1);
    scaleY.set(1.1);
  };

  const handleDragEnd = (_: any, info: any) => {
    setTimeout(() => {
      isDragging.current = false;
    }, 100);
    onDragEnd(contact.id, x.get(), y.get(), info.velocity);
  };

  const handleDrag = () => {
    if (onUpdatePosition) {
      onUpdatePosition(contact.id, x.get(), y.get());
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging.current) return;
    
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
      onDoubleClick(contact);
    } else {
      clickTimeout.current = setTimeout(() => {
        onClick(contact);
        clickTimeout.current = null;
      }, 250);
    }
  };

  return (
    <motion.div
      style={{ x, y, rotate, scaleX, scaleY, position: 'absolute', touchAction: 'none' }}
      drag
      dragMomentum={false}
      onPointerDown={handlePointerDown}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="cursor-grab active:cursor-grabbing group z-10 hover:z-20"
      whileHover={{ 
        scale: 1.15,
        transition: { type: 'spring', stiffness: 400, damping: 10 }
      }}
      whileTap={{ scale: 0.9, rotate: 0 }}
    >
      <div 
        className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center overflow-hidden border-4 transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-blue-500/20"
        style={{ borderColor: contact.border_color }}
      >
        {contact.photo ? (
          <img src={contact.photo} alt={contact.name} className="w-full h-full object-cover pointer-events-none select-none" />
        ) : (
          <span className="text-2xl font-bold text-gray-500 dark:text-gray-300 pointer-events-none select-none">
            {contact.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      
      {/* Glow Effect */}
      <div 
        className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-30 blur-xl transition-opacity -z-10"
        style={{ backgroundColor: contact.border_color }}
      />
      
      {/* Tooltip / Mini Name */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 bg-gray-900/90 backdrop-blur-sm text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 pointer-events-none whitespace-nowrap border border-white/10">
        {contact.name}
      </div>
    </motion.div>
  );
}
