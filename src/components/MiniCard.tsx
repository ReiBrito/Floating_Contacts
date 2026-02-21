import React from 'react';
import { Contact } from '../types';
import { Phone, Mail, Building, MessageCircle, X } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  contact: Contact;
  onClose: () => void;
  onEdit: () => void;
}

export function MiniCard({ contact, onClose, onEdit }: Props) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-5 w-80 border border-gray-100 dark:border-gray-800 z-40"
      onClick={e => e.stopPropagation()}
    >
      <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
        <X size={18} />
      </button>
      
      <div className="flex items-center gap-4 mb-4">
        <div 
          className="w-16 h-16 rounded-full border-2 flex-shrink-0 overflow-hidden bg-gray-100 dark:bg-gray-800"
          style={{ borderColor: contact.border_color }}
        >
          {contact.photo ? (
            <img src={contact.photo} alt={contact.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xl font-bold text-gray-400">
              {contact.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white leading-tight">{contact.name}</h3>
          {contact.company && (
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
              <Building size={12} /> {contact.company}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2 text-sm">
        {contact.phone && (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <Phone size={14} className="text-gray-400" />
            <a href={`tel:${contact.phone}`} className="hover:text-blue-500">{contact.phone}</a>
          </div>
        )}
        {contact.whatsapp && (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <MessageCircle size={14} className="text-green-500" />
            <a href={`https://wa.me/${contact.whatsapp.replace(/\\D/g, '')}`} target="_blank" rel="noreferrer" className="hover:text-green-500">{contact.whatsapp}</a>
          </div>
        )}
        {contact.email && (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <Mail size={14} className="text-gray-400" />
            <a href={`mailto:${contact.email}`} className="hover:text-blue-500 truncate">{contact.email}</a>
          </div>
        )}
      </div>

      {contact.notes && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-300">
          <p className="line-clamp-2">{contact.notes}</p>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between">
        <button onClick={onEdit} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
          Edit Details
        </button>
      </div>
    </motion.div>
  );
}
