import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useCharacter } from '@/lib/stores/useCharacter';
import { useMMOGame } from '@/lib/stores/useMMOGame';

export function Camera() {
  const { character } = useCharacter();
  const { cameraType } = useMMOGame();
  const { camera } = useThree();
  
  // Enhanced camera settings for FPS-style
  const cameraOffset = useRef(new THREE.Vector3(0, 6, 12));
  const cameraLookAt = useRef(new THREE.Vector3());
  const cameraPosition = useRef(new THREE.Vector3());
  const smoothFactor = useRef(0.2); // Faster response for aiming
  const rotationSmooth = useRef(0.3); // Smooth rotation follow
  
  // Smoothly follow player
  useFrame(() => {
    if (!character) return;
    
    // Calculate camera position based on camera type
    if (cameraType === 'thirdPerson') {
      // Position camera behind player and slightly to the left
      cameraPosition.current.set(
        character.position.x - Math.sin(character.rotation) * 8 - 1, // Reduced offset for less extreme positioning
        character.position.y + 4,
        character.position.z - Math.cos(character.rotation) * 8
      );
      
      // Look at player position with adjusted offset
      cameraLookAt.current.set(
        character.position.x + Math.sin(character.rotation) * 2 - 1, // Reduced offset to match camera
        character.position.y + 1.5,
        character.position.z + Math.cos(character.rotation) * 2
      );
    } else {
      // First person camera
      cameraPosition.current.set(
        character.position.x,
        character.position.y + 1.8, // Eye level
        character.position.z
      );
      
      // Look in the direction the player is facing
      cameraLookAt.current.set(
        character.position.x + Math.sin(character.rotation) * 5,
        character.position.y + 1.8,
        character.position.z + Math.cos(character.rotation) * 5
      );
    }
    
    // Smoothly interpolate to target position with improved smoothness
    camera.position.lerp(cameraPosition.current, smoothFactor.current);
    
    // Update camera target
    const currentLookAt = new THREE.Vector3();
    camera.getWorldDirection(currentLookAt);
    
    // Calculate target direction with more responsive aiming
    const targetDirection = new THREE.Vector3()
      .subVectors(cameraLookAt.current, camera.position)
      .normalize();
    
    // Improved interpolation for smoother camera movement
    const interpolatedDirection = new THREE.Vector3()
      .copy(currentLookAt)
      .lerp(targetDirection, smoothFactor.current * 1.2);
    
    // Set the camera's direction
    const lookAtPosition = new THREE.Vector3()
      .copy(camera.position)
      .add(interpolatedDirection);
    
    camera.lookAt(lookAtPosition);
  });
  
  return null;
}
