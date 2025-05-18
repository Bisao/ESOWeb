import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useCharacter } from '@/lib/stores/useCharacter';
import { useMMOGame } from '@/lib/stores/useMMOGame';

export function Camera() {
  const { character } = useCharacter();
  const { cameraType } = useMMOGame();
  const { camera } = useThree();
  
  // Camera settings
  const cameraOffset = useRef(new THREE.Vector3(0, 5, 10));
  const cameraLookAt = useRef(new THREE.Vector3());
  const cameraPosition = useRef(new THREE.Vector3());
  
  // Smoothly follow player
  useFrame(() => {
    if (!character) return;
    
    // Calculate camera position based on camera type
    if (cameraType === 'thirdPerson') {
      // Position camera behind player
      cameraPosition.current.set(
        character.position.x - Math.sin(character.rotation) * 8,
        character.position.y + 5,
        character.position.z - Math.cos(character.rotation) * 8
      );
      
      // Look at player position plus small offset in direction of movement
      cameraLookAt.current.set(
        character.position.x + Math.sin(character.rotation) * 2,
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
    
    // Smoothly interpolate to target position (lerp)
    camera.position.lerp(cameraPosition.current, 0.1);
    
    // Update camera target
    const currentLookAt = new THREE.Vector3();
    camera.getWorldDirection(currentLookAt);
    
    // Calculate target direction
    const targetDirection = new THREE.Vector3()
      .subVectors(cameraLookAt.current, camera.position)
      .normalize();
    
    // Interpolate the direction vector
    const interpolatedDirection = new THREE.Vector3()
      .copy(currentLookAt)
      .lerp(targetDirection, 0.1);
    
    // Set the camera's direction
    const lookAtPosition = new THREE.Vector3()
      .copy(camera.position)
      .add(interpolatedDirection);
    
    camera.lookAt(lookAtPosition);
  });
  
  return null;
}
