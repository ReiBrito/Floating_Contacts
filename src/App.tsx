import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Contact } from './types';
import { ContactAvatar } from './components/ContactAvatar';
import { ContactModal } from './components/ContactModal';
import { MiniCard } from './components/MiniCard';
import { TrashZone } from './components/TrashZone';
import { Plus, ZoomIn, ZoomOut, RotateCcw, Target } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import Matter from 'matter-js';

export default function App() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedContactId, setDraggedContactId] = useState<number | null>(null);
  const [isHoveringTrash, setIsHoveringTrash] = useState(false);
  const [zoom, setZoom] = useState(1);
  
  // Physics refs
  const engine = useRef(Matter.Engine.create({ gravity: { x: 0, y: 0 } }));
  const bodies = useRef<Map<number, Matter.Body>>(new Map());
  const requestRef = useRef<number>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize physics loop
  useEffect(() => {
    const world = engine.current.world;

    // Collision events for visual feedback
    const handleCollision = (event: Matter.IEventCollision<Matter.Engine>) => {
      event.pairs.forEach((pair) => {
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;
        
        // Calculate collision impact
        const velocityA = bodyA.velocity;
        const velocityB = bodyB.velocity;
        const relativeVelocity = {
          x: velocityA.x - velocityB.x,
          y: velocityA.y - velocityB.y
        };
        const impact = Math.sqrt(relativeVelocity.x ** 2 + relativeVelocity.y ** 2);

        // Screen shake on high impact
        if (impact > 10 && containerRef.current) {
          const intensity = Math.min(impact * 0.5, 10);
          containerRef.current.animate([
            { transform: `translate(${Math.random() * intensity}px, ${Math.random() * intensity}px)` },
            { transform: `translate(${Math.random() * -intensity}px, ${Math.random() * -intensity}px)` },
            { transform: 'translate(0, 0)' }
          ], { duration: 100 });
        }
        
        // Only if they are not static
        if (!bodyA.isStatic && !bodyB.isStatic) {
          // Add a tiny bit of random rotation on collision
          Matter.Body.setAngularVelocity(bodyA, (Math.random() - 0.5) * 0.2);
          Matter.Body.setAngularVelocity(bodyB, (Math.random() - 0.5) * 0.2);
        }
      });
    };

    Matter.Events.on(engine.current, 'collisionStart', handleCollision);

    const update = () => {
      Matter.Engine.update(engine.current, 1000 / 60);
      
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Sync bodies back to state + Out-of-bounds safety check
      setContacts(prev => prev.map(contact => {
        const body = bodies.current.get(contact.id);
        if (body && draggedContactId !== contact.id) {
          // Safety: If body glitched out of bounds, teleport back to center
          if (body.position.x < -500 || body.position.x > width + 500 || 
              body.position.y < -500 || body.position.y > height + 500) {
            Matter.Body.setPosition(body, { x: width / 2, y: height / 2 });
            Matter.Body.setVelocity(body, { x: 0, y: 0 });
          }

          return {
            ...contact,
            pos_x: body.position.x - 48,
            pos_y: body.position.y - 48
          };
        }
        return contact;
      }));
      
      requestRef.current = requestAnimationFrame(update);
    };
    
    requestRef.current = requestAnimationFrame(update);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      Matter.Events.off(engine.current, 'collisionStart', handleCollision);
    };
  }, [draggedContactId]);

  // Handle window boundaries
  useEffect(() => {
    const world = engine.current.world;
    let walls: Matter.Body[] = [];

    const createWalls = () => {
      if (walls.length > 0) {
        Matter.Composite.remove(world, walls);
      }

      const width = window.innerWidth;
      const height = window.innerHeight;
      const thickness = 100;

      const ground = Matter.Bodies.rectangle(width / 2, height + thickness / 2, width, thickness, { isStatic: true });
      const ceiling = Matter.Bodies.rectangle(width / 2, -thickness / 2, width, thickness, { isStatic: true });
      const leftWall = Matter.Bodies.rectangle(-thickness / 2, height / 2, thickness, height, { isStatic: true });
      const rightWall = Matter.Bodies.rectangle(width + thickness / 2, height / 2, thickness, height, { isStatic: true });

      walls = [ground, ceiling, leftWall, rightWall];
      Matter.Composite.add(world, walls);
    };

    createWalls();
    window.addEventListener('resize', createWalls);

    return () => {
      window.removeEventListener('resize', createWalls);
      Matter.Composite.remove(world, walls);
    };
  }, []);

  useEffect(() => {
    fetchContacts();
  }, []);

  // Update physics bodies when contacts change
  useEffect(() => {
    const world = engine.current.world;
    
    // Add new bodies
    contacts.forEach(contact => {
      if (!bodies.current.has(contact.id)) {
        const body = Matter.Bodies.circle(contact.pos_x + 48, contact.pos_y + 48, 48, {
          restitution: 0.85, // Even more bouncy
          friction: 0.001, // Almost no friction
          frictionStatic: 0,
          frictionAir: 0.015, // Slightly less air resistance for longer rolls
          density: 0.001
        });
        bodies.current.set(contact.id, body);
        Matter.Composite.add(world, body);
      }
    });

    // Remove old bodies
    const contactIds = new Set(contacts.map(c => c.id));
    bodies.current.forEach((body, id) => {
      if (!contactIds.has(id)) {
        Matter.Composite.remove(world, body);
        bodies.current.delete(id);
      }
    });
  }, [contacts.length]);

  const fetchContacts = async () => {
    try {
      const res = await fetch('/api/contacts');
      const data = await res.json();
      setContacts(data);
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    }
  };

  const handleSaveContact = async (contactData: Partial<Contact>) => {
    try {
      if (editingContact) {
        const res = await fetch(`/api/contacts/${editingContact.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(contactData),
        });
        const updated = await res.json();
        setContacts(contacts.map(c => c.id === updated.id ? updated : c));
        
        // Update physics body if needed
        if (selectedContact?.id === updated.id) setSelectedContact(updated);
      } else {
        const centerX = window.innerWidth / 2 - 48;
        const centerY = window.innerHeight / 2 - 48;
        
        const res = await fetch('/api/contacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...contactData, pos_x: centerX, pos_y: centerY }),
        });
        const created = await res.json();
        setContacts([...contacts, created]);
      }
      setIsModalOpen(false);
      setEditingContact(null);
    } catch (error) {
      console.error('Failed to save contact:', error);
    }
  };

  const handleDeleteContact = async (id: number) => {
    try {
      await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
      setContacts(prev => prev.filter(c => c.id !== id));
      if (selectedContact?.id === id) setSelectedContact(null);
    } catch (error) {
      console.error('Failed to delete contact:', error);
    }
  };

  const handleDragStart = (id: number) => {
    setIsDragging(true);
    setDraggedContactId(id);
    setSelectedContact(null);
    
    const body = bodies.current.get(id);
    if (body) {
      Matter.Body.setStatic(body, true);
    }
  };

  const handleDragEnd = async (id: number, x: number, y: number, dragVelocity: { x: number; y: number }) => {
    setIsDragging(false);
    setDraggedContactId(null);
    
    const body = bodies.current.get(id);
    if (body) {
      Matter.Body.setStatic(body, false);
      
      // Apply the drag velocity to the physics body
      // We scale it down slightly as motion/react velocity can be high
      Matter.Body.setVelocity(body, {
        x: dragVelocity.x * 0.05,
        y: dragVelocity.y * 0.05
      });
    }

    // Check if dropped in trash zone
    const windowHeight = window.innerHeight;
    if (y > windowHeight - 128) {
      handleDeleteContact(id);
      setIsHoveringTrash(false);
      return;
    }

    // Save new position
    try {
      await fetch(`/api/contacts/${id}/position`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pos_x: x, pos_y: y }),
      });
    } catch (error) {
      console.error('Failed to save position:', error);
    }
  };

  const handleCenterAll = () => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    contacts.forEach((contact, index) => {
      const body = bodies.current.get(contact.id);
      if (body) {
        // Spread them slightly around the center to avoid immediate explosion
        const angle = (index / contacts.length) * Math.PI * 2;
        const radius = Math.min(index * 20, 150); // Spiral out slightly
        const targetX = centerX + Math.cos(angle) * radius;
        const targetY = centerY + Math.sin(angle) * radius;
        
        Matter.Body.setPosition(body, { x: targetX, y: targetY });
        Matter.Body.setVelocity(body, { x: 0, y: 0 });
        Matter.Body.setAngularVelocity(body, 0);
      }
    });
  };

  // Update dragged body position
  const handleAvatarMove = useCallback((id: number, x: number, y: number) => {
    const body = bodies.current.get(id);
    if (body) {
      Matter.Body.setPosition(body, { x: x + 48, y: y + 48 });
    }
  }, []);

  // Track mouse position during drag to highlight trash
  useEffect(() => {
    if (!isDragging) return;
    
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      if (clientY > window.innerHeight - 128) {
        setIsHoveringTrash(true);
      } else {
        setIsHoveringTrash(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleMouseMove);
    };
  }, [isDragging]);

  // Mouse wheel zoom support
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom(prev => Math.min(Math.max(prev + delta, 0.5), 3));
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-black overflow-hidden"
      onClick={() => setSelectedContact(null)}
    >
      {/* Grid Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      </div>

      <motion.div 
        className="absolute inset-0 origin-center"
        animate={{ scale: zoom }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* World Boundary Indicator */}
        <div className="absolute inset-0 border-2 border-dashed border-gray-300/20 dark:border-white/10 pointer-events-none" />
        
        {contacts.map(contact => {
          const body = bodies.current.get(contact.id);
          const velocity = body ? { x: body.velocity.x, y: body.velocity.y } : { x: 0, y: 0 };
          
          return (
            <ContactAvatar
              key={contact.id}
              contact={contact}
              velocity={velocity}
              onUpdatePosition={handleAvatarMove}
              onClick={(c) => {
                if (!isDragging) setSelectedContact(c);
              }}
              onDoubleClick={(c) => {
                setEditingContact(c);
                setIsModalOpen(true);
                setSelectedContact(null);
              }}
              onDragStart={() => handleDragStart(contact.id)}
              onDragEnd={handleDragEnd}
            />
          );
        })}
      </motion.div>

      <TrashZone isVisible={isDragging} isHovered={isHoveringTrash} />

      {/* Zoom Controls */}
      <div className="fixed top-8 right-8 flex flex-col gap-2 z-30">
        <button
          onClick={(e) => { e.stopPropagation(); setZoom(prev => Math.min(prev + 0.2, 3)); }}
          className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="Zoom In"
        >
          <ZoomIn size={20} className="text-gray-600 dark:text-gray-300" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setZoom(prev => Math.max(prev - 0.2, 0.5)); }}
          className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut size={20} className="text-gray-600 dark:text-gray-300" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setZoom(1); }}
          className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="Reset Zoom"
        >
          <RotateCcw size={20} className="text-gray-600 dark:text-gray-300" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); handleCenterAll(); }}
          className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="Center All Contacts"
        >
          <Target size={20} className="text-gray-600 dark:text-gray-300" />
        </button>
        <div className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
          {Math.round(zoom * 100)}%
        </div>
      </div>

      <AnimatePresence>
        {selectedContact && (
          <MiniCard 
            contact={selectedContact} 
            onClose={() => setSelectedContact(null)}
            onEdit={() => {
              setEditingContact(selectedContact);
              setIsModalOpen(true);
              setSelectedContact(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && (
          <ContactModal 
            contact={editingContact}
            onClose={() => {
              setIsModalOpen(false);
              setEditingContact(null);
            }}
            onSave={handleSaveContact}
          />
        )}
      </AnimatePresence>

      {/* FAB */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setEditingContact(null);
          setIsModalOpen(true);
        }}
        className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95 z-30"
      >
        <Plus size={28} />
      </button>
    </div>
  );
}
