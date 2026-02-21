import React, { useState, useRef } from 'react';
import { Contact } from '../types';
import { X, Upload, Camera } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  contact?: Contact | null;
  onClose: () => void;
  onSave: (contact: Partial<Contact>) => void;
}

export function ContactModal({ contact, onClose, onSave }: Props) {
  const [formData, setFormData] = useState<Partial<Contact>>(
    contact || {
      name: '',
      phone: '',
      whatsapp: '',
      email: '',
      company: '',
      notes: '',
      photo: '',
      border_color: '#4CAF50',
    }
  );
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            {contact ? 'Edit Contact' : 'New Contact'}
          </h2>
          <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex justify-center mb-6">
            <div className="relative group">
              <div 
                className="w-24 h-24 rounded-full border-4 flex items-center justify-center overflow-hidden bg-gray-100 dark:bg-gray-800"
                style={{ borderColor: formData.border_color }}
              >
                {formData.photo ? (
                  <img src={formData.photo} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera size={32} className="text-gray-400" />
                )}
              </div>
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
              >
                <Upload size={20} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handlePhotoUpload}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Name</label>
              <input required type="text" name="name" value={formData.name || ''} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 dark:text-white transition-all" />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Phone</label>
              <input type="text" name="phone" value={formData.phone || ''} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 dark:text-white transition-all" />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">WhatsApp</label>
              <input type="text" name="whatsapp" value={formData.whatsapp || ''} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 dark:text-white transition-all" />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Email</label>
              <input type="email" name="email" value={formData.email || ''} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 dark:text-white transition-all" />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Company</label>
              <input type="text" name="company" value={formData.company || ''} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 dark:text-white transition-all" />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Notes</label>
              <textarea name="notes" value={formData.notes || ''} onChange={handleChange} rows={2} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 dark:text-white transition-all resize-none"></textarea>
            </div>

            <div className="col-span-2 flex items-center gap-3">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Border Color</label>
              <input type="color" name="border_color" value={formData.border_color || '#4CAF50'} onChange={handleChange} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors">
              Save Contact
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
