import React from 'react';
import { Link } from 'react-router-dom';
import { Timer, Trophy, ArrowRight, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { GridPattern } from '../components/magicui/grid-pattern';
import { MagicCard } from '../components/magicui/magic-card';

const HERO_SQUARES: [number, number][] = [
  [2, 1], [5, 2], [8, 1], [11, 3], [14, 1],
  [3, 4], [7, 3], [10, 2], [13, 4],
  [1, 6], [4, 5], [9, 5], [12, 6],
];

export default function Home() {
  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto pt-4 md:py-8">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-xl min-h-[48vh] flex flex-col items-center justify-center text-center border border-zinc-800 bg-zinc-950 px-8 py-16 gap-6"
      >
        {/* Grid background */}
        <GridPattern
          width={40}
          height={40}
          squares={HERO_SQUARES}
          className="text-brand-600"
        />

        {/* Badge */}
        <div className="relative z-10 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-brand-400 bg-brand-600/10 border border-brand-600/25 px-3 py-1 rounded-full">
          <Zap size={10} />
          Sistema de Control de Tiempos
        </div>

        {/* Heading */}
        <h1 className="relative z-10 text-4xl sm:text-5xl font-black tracking-tight text-white leading-tight max-w-2xl">
          TimeAttack v2:{' '}
          <span className="text-brand-500">Precisión en Cada Tramo</span>
        </h1>

        {/* Subtitle */}
        <p className="relative z-10 text-zinc-400 text-base max-w-lg leading-relaxed">
          Plataforma de rally en tiempo real. Cronometrado, clasificaciones en directo
          e inscripciones para pilotos.
        </p>

        {/* CTA */}
        <div className="relative z-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/clasificacion"
            className="inline-flex items-center gap-2 text-sm font-semibold bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-lg transition-colors shadow-lg shadow-brand-900/30"
          >
            <Trophy size={15} />
            Ver Clasificación
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-300 hover:text-white border border-zinc-700 hover:border-zinc-500 px-5 py-2.5 rounded-lg transition-colors"
          >
            Acceder
            <ArrowRight size={14} />
          </Link>
        </div>
      </motion.div>

      {/* ── Bento grid ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Card: Oficiales */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1, ease: 'easeOut' }}
        >
          <MagicCard className="h-full">
            <Link to="/login" className="flex flex-col gap-4 p-6 h-full group">
              <div className="w-10 h-10 bg-brand-600/15 border border-brand-600/25 rounded-lg flex items-center justify-center shrink-0">
                <Timer size={18} className="text-brand-500" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Rol</p>
                <h2 className="text-lg font-bold text-white">Oficial de Carrera</h2>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  Accede al cronometrador, gestiona rallies y campeonatos desde tu panel de control.
                </p>
              </div>
              <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-brand-500 group-hover:text-brand-400 transition-colors">
                Iniciar sesión <ArrowRight size={13} />
              </span>
            </Link>
          </MagicCard>
        </motion.div>

        {/* Card: Clasificación pública */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.15, ease: 'easeOut' }}
        >
          <MagicCard className="h-full">
            <Link to="/clasificacion" className="flex flex-col gap-4 p-6 h-full group">
              <div className="w-10 h-10 bg-brand-600/15 border border-brand-600/25 rounded-lg flex items-center justify-center shrink-0">
                <Trophy size={18} className="text-brand-500" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Acceso libre</p>
                <h2 className="text-lg font-bold text-white">Clasificación en Directo</h2>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  Sigue los tiempos de cada tramo y la clasificación general en tiempo real, sin necesidad de cuenta.
                </p>
              </div>
              <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-brand-500 group-hover:text-brand-400 transition-colors">
                Ver clasificación <ArrowRight size={13} />
              </span>
            </Link>
          </MagicCard>
        </motion.div>

      </div>
    </div>
  );
}
