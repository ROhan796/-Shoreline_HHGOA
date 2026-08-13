import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const HeroParticles: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Detect mobile for particle count
    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 800 : 2200;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 12;
    camera.position.y = 2;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Particle Geometry & Attributes
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const initialPositions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);
    const phaseOffsets = new Float32Array(particleCount);

    const colorEmber = new THREE.Color('#A0522D');
    const colorParticle = new THREE.Color('#8C7A65');
    const colorTide = new THREE.Color('#1A1A1A');

    for (let i = 0; i < particleCount; i++) {
      // Hemisphere / Wave layout
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 8 + Math.random() * 6;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = (r * Math.sin(phi) * Math.sin(theta)) * 0.4 - 1;
      const z = (r * Math.cos(phi)) * 0.8;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      initialPositions[i * 3] = x;
      initialPositions[i * 3 + 1] = y;
      initialPositions[i * 3 + 2] = z;

      // Color mixing between Ember, Particle, and Tide
      const randColor = Math.random();
      let mixedColor: THREE.Color;
      if (randColor > 0.85) {
        mixedColor = colorTide;
      } else if (randColor > 0.4) {
        mixedColor = colorParticle;
      } else {
        mixedColor = colorEmber;
      }

      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;

      scales[i] = Math.random() * 0.12 + 0.04;
      phaseOffsets[i] = Math.random() * Math.PI * 2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Particle Shader Material or PointsMaterial
    const particleMaterial = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(geometry, particleMaterial);
    scene.add(particles);

    // Mouse Interaction
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const onMouseMove = (e: MouseEvent) => {
      mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', onMouseMove);

    // Resize Handler
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', onResize);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse lerp
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      // Rotate particle cloud gently
      particles.rotation.y = elapsedTime * 0.06 + mouse.x * 0.3;
      particles.rotation.x = mouse.y * 0.2;

      // Animate position array for gentle breathing wave
      const posAttr = geometry.attributes.position as THREE.BufferAttribute;
      const array = posAttr.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        const ix = i * 3;
        const iy = i * 3 + 1;
        const iz = i * 3 + 2;

        const initY = initialPositions[iy];
        const phase = phaseOffsets[i];

        // Wave motion
        array[iy] = initY + Math.sin(elapsedTime * 1.5 + phase) * 0.25;

        // Mouse repelling in 3D
        const px = array[ix];
        const py = array[iy];
        const dist = Math.sqrt((px - mouse.x * 10) ** 2 + (py - mouse.y * 6) ** 2);
        if (dist < 3) {
          array[ix] += (px - mouse.x * 10) * 0.02;
          array[iy] += (py - mouse.y * 6) * 0.02;
        } else {
          // Softly return to origin x
          array[ix] += (initialPositions[ix] - array[ix]) * 0.05;
        }
      }

      posAttr.needsUpdate = true;
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      particleMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0 pointer-events-none opacity-80 overflow-hidden"
      aria-hidden="true"
    />
  );
};
