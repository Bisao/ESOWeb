import { useState, useEffect } from 'react';
import { useMMOGame } from '@/lib/stores/useMMOGame';
import { useCharacter } from '@/lib/stores/useCharacter';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { GamePhase } from '@shared/types';

export function MobileControls() {
  const { gamePhase } = useMMOGame();
  const { setAttacking } = useCharacter();
  const isMobile = useIsMobile();
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  
  // Check if device supports touch events
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);
  
  // Only show controls on mobile/touch devices and when playing
  if (!isMobile && !isTouchDevice || gamePhase !== GamePhase.Playing) return null;
  
  return (
    <div className="fixed inset-0 pointer-events-none">
      {/* Movement D-pad */}
      <div className="absolute bottom-8 left-8 grid grid-cols-3 grid-rows-3 gap-3 pointer-events-auto scale-110">
        {/* Empty */}
        <div></div>
        {/* Up */}
        <MobileButton 
          label="↑" 
          controlKey="KeyW" 
          className="bg-gray-800/80 text-white"
        />
        {/* Empty */}
        <div></div>
        
        {/* Left */}
        <MobileButton 
          label="←" 
          controlKey="KeyA" 
          className="bg-gray-800/80 text-white"
        />
        {/* Center - indicator */}
        <div className="flex items-center justify-center h-14 w-14 bg-gray-900/50 rounded-full">
          <span className="text-xs text-white/70">MOVE</span>
        </div>
        {/* Right */}
        <MobileButton 
          label="→" 
          controlKey="KeyD" 
          className="bg-gray-800/80 text-white"
        />
        
        {/* Empty */}
        <div></div>
        {/* Down */}
        <MobileButton 
          label="↓" 
          controlKey="KeyS" 
          className="bg-gray-800/80 text-white"
        />
        {/* Empty */}
        <div></div>
      </div>
      
      {/* Action buttons */}
      <div className="absolute bottom-24 right-6 flex flex-col gap-3 items-end pointer-events-auto">
        {/* Attack button */}
        <MobileButton 
          label="ATTACK" 
          controlKey="KeyF" 
          className="bg-red-600/90 hover:bg-red-700 active:scale-95 active:bg-red-800 text-white h-16 w-16 text-xs transition-all"
          onClick={() => {
            setAttacking(true);
            // Reset attack state after animation
            setTimeout(() => {
              setAttacking(false);
            }, 400);
          }}
        />
        
        {/* Jump button */}
        <MobileButton 
          label="JUMP" 
          controlKey="Space" 
          className="bg-green-600/90 hover:bg-green-700 text-white h-16 w-16 text-xs"
        />
        
        {/* Inventory button */}
        <MobileButton 
          label="INV" 
          controlKey="KeyI" 
          className="bg-blue-600/90 hover:bg-blue-700 text-white h-16 w-16 text-xs"
        />
      </div>
    </div>
  );
}

// Mobile control button that simulates keyboard events
function MobileButton({ 
  label, 
  controlKey, 
  className = "", 
  onClick
}: { 
  label: string, 
  controlKey: string, 
  className?: string,
  onClick?: () => void
}) {
  // Create keyboard event handlers
  const simulateKeyDown = () => {
    // Custom handler if provided
    if (onClick) {
      onClick();
      return;
    }
    
    // Otherwise simulate keyboard event
    window.dispatchEvent(new KeyboardEvent('keydown', { code: controlKey, bubbles: true }));
  };
  
  const simulateKeyUp = () => {
    if (onClick) return; // Don't simulate key up if using custom handler
    window.dispatchEvent(new KeyboardEvent('keyup', { code: controlKey, bubbles: true }));
  };

  return (
    <button
      className={`rounded-full h-14 w-14 flex items-center justify-center font-bold shadow-lg ${className}`}
      onTouchStart={simulateKeyDown}
      onTouchEnd={simulateKeyUp}
      onMouseDown={simulateKeyDown}
      onMouseUp={simulateKeyUp}
      onMouseLeave={simulateKeyUp}
    >
      {label}
    </button>
  );
}