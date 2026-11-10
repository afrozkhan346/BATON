import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeHeroCanvasProps {
  className?: string;
  isDark?: boolean;
}

export const ThreeHeroCanvas: React.FC<ThreeHeroCanvasProps> = ({ className = '', isDark = true }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software rendering
    let isSoftwareGl = false;
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (gl) {
        const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const rendererStr = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          if (typeof rendererStr === 'string' && /swiftshader|llvmpipe|softpipe/i.test(rendererStr)) {
            isSoftwareGl = true;
          }
        }
      }
    } catch {
      // fallback
    }

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 7;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isSoftwareGl ? 1 : 1.5));
    container.appendChild(renderer.domElement);

    // Group for mouse rotation
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    // 1. Central Icosahedron Crystal Core
    const coreGeo = new THREE.IcosahedronGeometry(1.6, 0);
    const coreMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x10b981 : 0x059669,
      roughness: 0.2,
      metalness: 0.8,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreGroup.add(coreMesh);

    // 2. Inner Glowing Core
    const innerGeo = new THREE.SphereGeometry(0.9, 16, 16);
    const innerMat = new THREE.MeshBasicMaterial({
      color: isDark ? 0x06b6d4 : 0x0891b2,
      wireframe: false,
      transparent: true,
      opacity: 0.35,
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    coreGroup.add(innerMesh);

    // 3. Orbital Rings (Evidence verification rings)
    const ring1Geo = new THREE.TorusGeometry(2.5, 0.02, 16, 64);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: isDark ? 0x34d399 : 0x10b981,
      transparent: true,
      opacity: 0.6,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ringMat1);
    ring1.rotation.x = Math.PI / 3;
    coreGroup.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(3.1, 0.02, 16, 64);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: isDark ? 0x38bdf8 : 0x0284c7,
      transparent: true,
      opacity: 0.45,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ringMat2);
    ring2.rotation.y = Math.PI / 4;
    ring2.rotation.x = Math.PI / 6;
    coreGroup.add(ring2);

    // 4. Floating Data Nodes on Rings
    const nodeGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0x6ee7b7 });
    const nodes: THREE.Mesh[] = [];
    for (let i = 0; i < 6; i++) {
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      coreGroup.add(node);
      nodes.push(node);
    }

    // 5. Ambient & Point Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x10b981, 2, 20);
    pointLight.position.set(4, 5, 4);
    scene.add(pointLight);

    const secondaryLight = new THREE.PointLight(0x38bdf8, 1.5, 20);
    secondaryLight.position.set(-4, -3, 3);
    scene.add(secondaryLight);

    // Mouse Tracking
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseRef.current.targetX = x * 0.8;
      mouseRef.current.targetY = y * 0.8;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth mouse damping
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      coreGroup.rotation.y = elapsed * 0.25 + mouseRef.current.x;
      coreGroup.rotation.x = Math.sin(elapsed * 0.15) * 0.2 + mouseRef.current.y * 0.6;

      ring1.rotation.z = elapsed * 0.3;
      ring2.rotation.z = -elapsed * 0.2;

      // Pulse inner sphere
      const pulse = 1 + Math.sin(elapsed * 2) * 0.06;
      innerMesh.scale.set(pulse, pulse, pulse);

      // Move orbital nodes
      nodes.forEach((n, idx) => {
        const angle = elapsed * 0.5 + (idx * Math.PI) / 3;
        const radius = idx % 2 === 0 ? 2.5 : 3.1;
        n.position.x = Math.cos(angle) * radius;
        n.position.y = Math.sin(angle) * (radius * 0.6);
        n.position.z = Math.sin(angle * 1.5) * 0.8;
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      ring1Geo.dispose();
      ringMat1.dispose();
      ring2Geo.dispose();
      ringMat2.dispose();
      nodeGeo.dispose();
      nodeMat.dispose();
    };
  }, [isDark]);

  return (
    <div
      ref={mountRef}
      className={`relative w-full h-full min-h-[380px] cursor-grab active:cursor-grabbing select-none ${className}`}
      data-testid="three-hero-canvas"
      aria-label="Interactive 3D Evidence Core visualization"
    />
  );
};
