import React from 'react';
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Spinner,
} from '@nextui-org/react';
import { usePilotData } from '../hooks/usePilotData';

export default function PilotoMisPruebas({ userId }: { userId?: string }) {
  const { myInscriptions, loading } = usePilotData(userId);

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 pt-4 md:py-8">

      {/* Header */}
      <div>
        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Piloto</p>
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1">Mis Pruebas</h1>
        <p className="text-zinc-500 text-sm">
          Historial completo de inscripciones
          {!loading && myInscriptions.length > 0 && (
            <span className="ml-2 font-mono text-zinc-600">({myInscriptions.length})</span>
          )}
        </p>
      </div>

      {/* Table */}
      <div className="bg-[#09090b] border border-zinc-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Spinner color="primary" size="md" />
          </div>
        ) : (
          <Table
            aria-label="Mis inscripciones"
            removeWrapper
            classNames={{
              th: "bg-zinc-950 text-zinc-500 font-bold uppercase tracking-wider text-[10px] border-b border-zinc-800 py-3 first:pl-5 last:pr-5",
              td: "border-b border-zinc-800/40 py-3 first:pl-5 last:pr-5",
              tr: "hover:bg-zinc-900/40 transition-colors",
            }}
          >
            <TableHeader>
              <TableColumn>Rally</TableColumn>
              <TableColumn>Campeonato</TableColumn>
              <TableColumn>Club</TableColumn>
              <TableColumn className="text-center w-20">Dorsal</TableColumn>
              <TableColumn>Categoría</TableColumn>
              <TableColumn>Coche</TableColumn>
              <TableColumn>Escudería</TableColumn>
              <TableColumn>Corte</TableColumn>
            </TableHeader>

            <TableBody
              emptyContent={
                <div className="py-12 flex flex-col items-center gap-2">
                  <p className="text-zinc-600 text-sm italic">Sin inscripciones todavía.</p>
                  <p className="text-zinc-700 text-xs">Ve a Explorar para apuntarte a una prueba.</p>
                </div>
              }
            >
              {myInscriptions.map(ins => {
                const rallyName  = (ins.rallies as any)?.name ?? '—';
                const champName  = (ins.rallies as any)?.championships?.name ?? '—';
                const clubName   = (ins.rallies as any)?.championships?.clubs?.name ?? '—';
                const catName    = (ins.categories as any)?.name ?? '—';
                const sessName   = (ins.rally_sessions as any)?.name ?? '—';

                return (
                  <TableRow key={ins.id}>
                    <TableCell>
                      <span className="text-zinc-100 font-medium text-sm">{rallyName}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-zinc-400 text-xs">{champName}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-zinc-500 text-xs">{clubName}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-mono font-black text-brand-400 text-sm">
                        {ins.dorsal_num != null ? `#${ins.dorsal_num}` : '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Chip size="sm" variant="flat"
                        className="bg-zinc-900 text-zinc-200 border border-zinc-800 text-xs font-medium"
                      >
                        {catName}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <span className="text-zinc-400 text-xs">{ins.car ?? '—'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-zinc-400 text-xs">{ins.team ?? '—'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-zinc-500 text-xs">{sessName}</span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

    </div>
  );
}
