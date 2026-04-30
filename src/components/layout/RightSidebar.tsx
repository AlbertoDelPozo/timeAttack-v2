import React from 'react';
import { Calendar as CalendarIcon, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

export default function RightSidebar() {
  return (
    <aside className="hidden xl:flex w-[320px] flex-shrink-0 flex-col border-l border-zinc-800 bg-[#09090b] overflow-y-auto">
      {/* Calendar Section */}
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <CalendarIcon size={16} className="text-zinc-400" /> Calendario Global
          </h3>
          <div className="flex gap-1">
            <button className="p-1 hover:bg-zinc-800 rounded-md text-zinc-400"><ChevronLeft size={16} /></button>
            <button className="p-1 hover:bg-zinc-800 rounded-md text-zinc-400"><ChevronRight size={16} /></button>
          </div>
        </div>
        
        {/* Visual Mock Calendar */}
        <div className="bg-[#09090b] border border-zinc-800 rounded-lg p-3 shadow-sm">
          <div className="text-center font-medium text-zinc-100 text-sm mb-3">Abril 2026</div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-zinc-500 mb-2">
            <div>Lu</div><div>Ma</div><div>Mi</div><div>Ju</div><div>Vi</div><div>Sa</div><div>Do</div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-sm text-zinc-300">
            {/* Empty days */}
            <div className="py-1 text-zinc-700">30</div>
            <div className="py-1 text-zinc-700">31</div>
            {/* Days 1-30 */}
            {[...Array(30)].map((_, i) => {
              const day = i + 1;
              const hasRally = day === 14 || day === 15 || day === 28;
              const isSelected = day === 14;
              return (
                <div 
                  key={day} 
                  className={`py-1 rounded-md cursor-pointer transition-colors ${
                    isSelected 
                      ? 'bg-red-600 text-white font-semibold' 
                      : hasRally 
                        ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 font-semibold' 
                        : 'hover:bg-zinc-800'
                  }`}
                >
                  {day}
                </div>
              )
            })}
            {/* Trailing empty days */}
            <div className="py-1 text-zinc-700">1</div>
            <div className="py-1 text-zinc-700">2</div>
            <div className="py-1 text-zinc-700">3</div>
          </div>
          {/* TODO: Connect with react-day-picker when rallies table has start_date / end_date */}
        </div>
      </div>

      {/* Upcoming Events Section */}
      <div className="p-6 flex-1">
        <h3 className="text-sm font-semibold text-zinc-100 mb-4 px-1">Próximos Eventos</h3>
        
        <div className="relative pl-3 border-l border-zinc-800 ml-2 space-y-6">
          {/* Mock Event 1 */}
          <div className="relative">
            <div className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-red-600 ring-4 ring-[#09090b]"></div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-red-500">14 - 15 Abr</span>
              <h4 className="text-sm font-semibold text-zinc-100 leading-tight">Rally Isla de los Volcanes</h4>
              <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
                <MapPin size={12} /> Camp. Autonómico de Tierra
              </p>
            </div>
          </div>

          {/* Mock Event 2 */}
          <div className="relative">
            <div className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-zinc-700 ring-4 ring-[#09090b]"></div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-zinc-400">28 Abr</span>
              <h4 className="text-sm font-semibold text-zinc-300 leading-tight">Subida a Haría</h4>
              <p className="text-xs text-zinc-500 flex items-center gap-1.5 mt-0.5">
                <MapPin size={12} /> Camp. Provincial Montaña
              </p>
            </div>
          </div>
          
          {/* Mock Event 3 */}
          <div className="relative">
            <div className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-zinc-700 ring-4 ring-[#09090b]"></div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-zinc-400">12 May</span>
              <h4 className="text-sm font-semibold text-zinc-300 leading-tight">Rally Senderos de La Palma</h4>
              <p className="text-xs text-zinc-500 flex items-center gap-1.5 mt-0.5">
                <MapPin size={12} /> Camp. Regional de Asfalto
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
