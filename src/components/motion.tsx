"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { type ReactNode } from "react";

const TRANSITIONS = {
  slow: { duration: 0.62, ease: [0.22, 1, 0.36, 1] as const },
  medium: { duration: 0.46, ease: [0.22, 1, 0.36, 1] as const },
  fast: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const },
};

const VIEWPORT = { once: true, margin: "-80px" };

// Shared base variants keep motion rhythm consistent across marketing and app routes.
const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const slideInLeftVariants: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0 },
};

const slideInRightVariants: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0 },
};

const staggerContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1 },
};

// ── Shared props ────────────────────────────────────────────────
interface BaseProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

// ── FadeUp ──────────────────────────────────────────────────────
export function FadeUp({ children, className, delay = 0 }: BaseProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? "visible" : "hidden"}
      whileInView="visible"
      viewport={VIEWPORT}
      variants={fadeUpVariants}
      transition={reduced ? { duration: 0 } : { ...TRANSITIONS.slow, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── FadeIn ──────────────────────────────────────────────────────
export function FadeIn({ children, className, delay = 0 }: BaseProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? "visible" : "hidden"}
      whileInView="visible"
      viewport={VIEWPORT}
      variants={fadeInVariants}
      transition={reduced ? { duration: 0 } : { ...TRANSITIONS.medium, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── SlideInLeft ─────────────────────────────────────────────────
export function SlideInLeft({ children, className, delay = 0 }: BaseProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? "visible" : "hidden"}
      whileInView="visible"
      viewport={VIEWPORT}
      variants={slideInLeftVariants}
      transition={reduced ? { duration: 0 } : { ...TRANSITIONS.slow, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── SlideInRight ────────────────────────────────────────────────
export function SlideInRight({ children, className, delay = 0 }: BaseProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? "visible" : "hidden"}
      whileInView="visible"
      viewport={VIEWPORT}
      variants={slideInRightVariants}
      transition={reduced ? { duration: 0 } : { ...TRANSITIONS.slow, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── StaggerContainer ─────────────────────────────────────────────
export function StaggerContainer({ children, className }: Omit<BaseProps, "delay">) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? "visible" : "hidden"}
      whileInView="visible"
      viewport={VIEWPORT}
      variants={staggerContainerVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── StaggerItem ──────────────────────────────────────────────────
export function StaggerItem({ children, className }: Omit<BaseProps, "delay">) {
  return (
    <motion.div
      variants={fadeUpVariants}
      transition={TRANSITIONS.slow}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function ScaleIn({ children, className, delay = 0 }: BaseProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? "visible" : "hidden"}
      whileInView="visible"
      viewport={VIEWPORT}
      variants={scaleInVariants}
      transition={reduced ? { duration: 0 } : { ...TRANSITIONS.medium, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function RevealMask({ children, className, delay = 0 }: BaseProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? { opacity: 1 } : { opacity: 0, clipPath: "inset(0 0 100% 0)" }}
      whileInView={reduced ? { opacity: 1 } : { opacity: 1, clipPath: "inset(0 0 0% 0)" }}
      viewport={VIEWPORT}
      transition={reduced ? { duration: 0 } : { ...TRANSITIONS.slow, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
