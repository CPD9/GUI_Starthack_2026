"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface SparkleProps {
  className?: string;
  dotCount?: number;
  reactRadius?: number;
  particleColor?: string; // RGB format
  glowColor?: string;
  position?: "center" | "top-left" | "top-right" | "bottom-right" | "inline" | "fullscreen";
  onClick?: () => void;
  width?: number;
  height?: number;
  sphereRadius?: number; // Radius of the globe
  globalMouseTracking?: boolean; // Track mouse globally even in inline mode
}

interface Particle {
  // 3D spherical coordinates
  theta: number; // horizontal angle (0 to 2PI)
  phi: number;   // vertical angle (0 to PI)
  r: number;     // distance from center
  baseR: number; // original radius
  // Velocities for smooth animation
  vTheta: number;
  vPhi: number;
  vR: number;
  // Visual properties
  size: number;
  baseAlpha: number;
  phase: number;
  pulseSpeed: number;
  orbitSpeed: number;
  // Cursor interaction state
  pushX: number;
  pushY: number;
  pushZ: number;
}

export const SparkledBackground = ({
  className,
  dotCount = 200, // Reduced from 500 for better performance
  reactRadius = 150,
  particleColor = "255, 255, 255",
  glowColor = "255, 255, 255",
  position = "fullscreen",
  onClick,
  width,
  height,
  sphereRadius = 250,
  globalMouseTracking = false,
}: SparkleProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number>();
  const mouseRef = useRef({ x: -999, y: -999 });
  const timeRef = useRef(0);
  const rotationRef = useRef({ x: 0, y: 0 });

  const isInline = position === "inline";
  const isFullscreen = position === "fullscreen";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let canvasWidth = isInline ? (width || 300) : (isFullscreen ? window.innerWidth : 600);
    let canvasHeight = isInline ? (height || 300) : (isFullscreen ? window.innerHeight : 600);

    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    const random = (min: number, max: number) => Math.random() * (max - min) + min;

    // Create particles distributed on a sphere shell
    // Very dense on outer surface, sparse toward center - looks like a solid globe
    const initParticles = () => {
      const particles: Particle[] = [];
      
      for (let i = 0; i < dotCount; i++) {
        const u = Math.random();
        // Tighter shell for more condensed look - 95% of particles in outer 10% of radius
        const normalizedR = 0.92 + 0.08 * Math.pow(u, 0.1); // 0.92 to 1.0 - very tight shell
        const r = normalizedR * sphereRadius;
        
        // Uniform distribution on sphere surface
        const theta = random(0, Math.PI * 2);
        const phi = Math.acos(random(-1, 1));
        
        // Smaller, crisper particles for condensed look
        const size = random(0.8, 1.8);
        const baseAlpha = random(0.7, 1.0);
        
        particles.push({
          theta,
          phi,
          r,
          baseR: r,
          vTheta: 0,
          vPhi: 0,
          vR: 0,
          size,
          baseAlpha,
          phase: random(0, Math.PI * 2),
          pulseSpeed: random(0.02, 0.04),
          orbitSpeed: random(0.0003, 0.0008) * (Math.random() > 0.5 ? 1 : -1),
          pushX: 0,
          pushY: 0,
          pushZ: 0,
        });
      }
      
      particlesRef.current = particles;
    };

    const resizeCanvas = () => {
      if (isFullscreen) {
        canvasWidth = window.innerWidth;
        canvasHeight = window.innerHeight;
      }
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      initParticles();
    };

    // Convert spherical to 2D screen coordinates with rotation
    const project3D = (theta: number, phi: number, r: number, rotX: number, rotY: number) => {
      // Convert spherical to 3D cartesian
      let x = r * Math.sin(phi) * Math.cos(theta);
      let y = r * Math.cos(phi);
      let z = r * Math.sin(phi) * Math.sin(theta);
      
      // Apply Y rotation (horizontal mouse movement)
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const x1 = x * cosY - z * sinY;
      const z1 = x * sinY + z * cosY;
      x = x1;
      z = z1;
      
      // Apply X rotation (vertical mouse movement)
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const y1 = y * cosX - z * sinX;
      const z2 = y * sinX + z * cosX;
      y = y1;
      z = z2;
      
      // Simple perspective projection
      const perspective = 800;
      const scale = perspective / (perspective + z);
      
      return {
        x: centerX + x * scale,
        y: centerY + y * scale,
        z: z,
        scale: scale,
      };
    };

    const drawParticle = (screenX: number, screenY: number, size: number, alpha: number, depth: number) => {
      // Adjust alpha based on depth (particles in back are dimmer)
      const depthFactor = Math.max(0.3, (depth + sphereRadius) / (sphereRadius * 2));
      const finalAlpha = alpha * depthFactor;
      
      // Simple solid circle instead of gradient for better performance
      ctx.beginPath();
      ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${particleColor}, ${finalAlpha})`;
      ctx.fill();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      timeRef.current += 0.016;
      const t = timeRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const particles = particlesRef.current;

      // Mouse is interacting if within canvas
      const mouseActive = mx > 0 && mx < canvasWidth && my > 0 && my < canvasHeight;

      // Calculate rotation based on mouse position - stronger effect when mouse is active
      const rotationStrength = mouseActive ? 1.2 : 0.3;
      const targetRotY = (mx > 0) ? (mx - centerX) / canvasWidth * rotationStrength : 0;
      const targetRotX = (my > 0) ? (my - centerY) / canvasHeight * (rotationStrength * 0.6) : 0;
      
      // Smooth rotation interpolation - faster response when mouse is active
      const interpolationSpeed = mouseActive ? 0.08 : 0.03;
      rotationRef.current.x += (targetRotX - rotationRef.current.x) * interpolationSpeed;
      rotationRef.current.y += (targetRotY - rotationRef.current.y) * interpolationSpeed;
      
      // Auto-rotation - slower when mouse is interacting
      const autoRotSpeed = mouseActive ? 0.05 : 0.15;
      const autoRotY = t * autoRotSpeed;
      const finalRotX = rotationRef.current.x;
      const finalRotY = rotationRef.current.y + autoRotY;
      
      // Pre-compute for performance
      const pushRadiusSq = reactRadius * reactRadius;

      // Sort particles by z-depth for proper rendering (back to front)
      const projectedParticles = particles.map((p, i) => {
        // Gentle orbital motion - faster when mouse is near
        p.theta += p.orbitSpeed * (mouseActive ? 1.5 : 1);
        
        // Subtle breathing effect on radius
        const breathe = Math.sin(t * 0.5 + p.phase) * 0.05;
        const currentR = p.baseR * (1 + breathe);
        
        // Project to get screen position
        const projected = project3D(p.theta, p.phi, currentR, finalRotX, finalRotY);
        
        // Cursor repulsion effect - particles push away from cursor
        if (mouseActive) {
          const dx = projected.x - mx;
          const dy = projected.y - my;
          const distSq = dx * dx + dy * dy;
          
          if (distSq < pushRadiusSq && distSq > 0) {
            const dist = Math.sqrt(distSq); // Only compute sqrt when needed
            const ratio = 1 - dist / reactRadius;
            // Strong repulsion that falls off with distance
            const force = ratio * ratio * 35;
            const invDist = 1 / dist;
            const pushDx = dx * invDist * force;
            const pushDy = dy * invDist * force;
            
            // Smoothly apply push force
            p.pushX += (pushDx - p.pushX) * 0.15;
            p.pushY += (pushDy - p.pushY) * 0.15;
            
            // Also pulse the particle brighter when near cursor
            const proximityGlow = ratio * 0.5;
            p.baseAlpha = Math.min(1, 0.7 + proximityGlow);
          } else {
            // Decay push when cursor moves away
            p.pushX *= 0.92;
            p.pushY *= 0.92;
          }
        } else {
          // Smoothly return to original position when mouse leaves
          p.pushX *= 0.95;
          p.pushY *= 0.95;
        }
        
        // Pulsing sparkle
        const pulseAlpha = p.baseAlpha * (0.7 + 0.3 * Math.sin(t * p.pulseSpeed * 60 + p.phase));
        
        return {
          x: projected.x + p.pushX,
          y: projected.y + p.pushY,
          z: projected.z,
          scale: projected.scale,
          size: p.size * projected.scale,
          alpha: pulseAlpha,
          index: i,
        };
      });

      // Sort by z (back to front)
      projectedParticles.sort((a, b) => a.z - b.z);

      // Draw particles
      for (const pp of projectedParticles) {
        drawParticle(pp.x, pp.y, pp.size, pp.alpha, pp.z);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Throttle mouse movement for performance
    let lastMouseUpdate = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      if (now - lastMouseUpdate < 16) return; // ~60fps throttle
      lastMouseUpdate = now;
      
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -999, y: -999 };
    };

    const handleResize = () => {
      if (isFullscreen) {
        resizeCanvas();
      }
    };

    resizeCanvas();
    animate();

    const useWindowMouse = isFullscreen || globalMouseTracking;
    const mouseTarget = useWindowMouse ? window : canvas;
    mouseTarget.addEventListener("mousemove", handleMouseMove as EventListener);
    if (!useWindowMouse) {
      canvas.addEventListener("mouseleave", handleMouseLeave);
    }
    if (isFullscreen) {
      window.addEventListener("resize", handleResize);
    }

    return () => {
      mouseTarget.removeEventListener("mousemove", handleMouseMove as EventListener);
      if (!useWindowMouse) {
        canvas.removeEventListener("mouseleave", handleMouseLeave);
      }
      if (isFullscreen) {
        window.removeEventListener("resize", handleResize);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [dotCount, reactRadius, particleColor, glowColor, position, isInline, isFullscreen, width, height, globalMouseTracking]);

  const positionClasses: Record<string, string> = {
    "center": "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
    "top-left": "fixed -top-[300px] -left-[300px]",
    "top-right": "fixed -top-[300px] -right-[300px]",
    "bottom-right": "fixed -bottom-[300px] -right-[300px]",
    "inline": "",
    "fullscreen": "fixed inset-0",
  };

  if (isInline) {
    return (
      <canvas
        ref={canvasRef}
        onClick={onClick}
        className={cn("cursor-pointer", className)}
        style={{ width: width || 300, height: height || 300 }}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      onClick={onClick}
      className={cn(
        isFullscreen ? "pointer-events-none" : "pointer-events-auto",
        positionClasses[position],
        className
      )}
      style={isFullscreen ? { width: '100vw', height: '100vh' } : { width: '600px', height: '600px' }}
    />
  );
};

export default SparkledBackground;
