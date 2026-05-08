"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { type ReactNode } from "react";

// ── Shared Variants ──────────────────────────────────────────────
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

// ── Shared transition ────────────────────────────────────────────
const defaultTransition = { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const };
const fastTransition = { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const };

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
      viewport={{ once: true, margin: "-80px" }}
      variants={fadeUpVariants}
      transition={reduced ? { duration: 0 } : { ...defaultTransition, delay }}
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
      viewport={{ once: true, margin: "-80px" }}
      variants={fadeInVariants}
      transition={reduced ? { duration: 0 } : { ...fastTransition, delay }}
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
      viewport={{ once: true, margin: "-80px" }}
      variants={slideInLeftVariants}
      transition={reduced ? { duration: 0 } : { ...defaultTransition, delay }}
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
      viewport={{ once: true, margin: "-80px" }}
      variants={slideInRightVariants}
      transition={reduced ? { duration: 0 } : { ...defaultTransition, delay }}
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
      viewport={{ once: true, margin: "-80px" }}
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
      transition={defaultTransition}
      className={className}
    >
      {children}
    </motion.div>
  );
}
