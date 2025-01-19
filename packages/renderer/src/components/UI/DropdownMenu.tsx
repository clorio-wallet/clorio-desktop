import React, {useState, useEffect, useRef, ReactNode} from 'react';
import './DropdownMenu.css'; 

interface DropdownMenuProps {
  buttonLabel: ReactNode;
  children: ReactNode;
  maxHeight?: number; 
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({buttonLabel, children, maxHeight = 500}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const onDropdownClick = e => {
    e.stopPropagation();
  };

  return (
    <div className="dropdown" onClick={onDropdownClick} ref={dropdownRef}>
      <button onClick={toggleMenu} className="dropdown-toggle">
        {buttonLabel}
      </button>
      <div className={`dropdown-menu ${isOpen ? 'open' : ''}`} style={{maxHeight: isOpen ? maxHeight : 0, display: isOpen ? 'block' : 'none'}}>
        {children}
      </div>
    </div>
  );
};

export default DropdownMenu;
