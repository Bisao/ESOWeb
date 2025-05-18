import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useCharacter } from '@/lib/stores/useCharacter';
import { useMMOGame } from '@/lib/stores/useMMOGame';
import { PointerLockControls } from '@react-three/drei';

export function Camera() {
  const { character } = useCharacter();
  const { cameraType } = useMMOGame();
  const { camera } = useThree();

  const cameraPosition = useRef(new THREE.Vector3());
  const smoothFactor = useRef(0.15);

  useFrame(() => {
    if (!character) return;

    if (cameraType === 'firstPerson') {
      // Position camera at character eyes
      cameraPosition.current.set(
        character.position.x,
        character.position.y + 1.8,
        character.position.z
      );
    } else {
      // Third person position
      cameraPosition.current.set(
        character.position.x - Math.sin(character.rotation) * 8,
        character.position.y + 5,
        character.position.z - Math.cos(character.rotation) * 8
      );
    }

    // Smooth camera position transition
    camera.position.lerp(cameraPosition.current, smoothFactor.current);
  });

  return <PointerLockControls />;
}