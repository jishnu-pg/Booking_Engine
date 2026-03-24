import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ChevronDown, Minus, Plus } from "lucide-react"
import { format, addDays } from "date-fns"
import type { DateRange } from "react-day-picker"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"

// Reusable Counter matching the exact Figma design
function GuestCounter({
  label,
  sublabel,
  value,
  onChange,
  min = 0,
}: {
  label: string
  sublabel?: string
  value: number
  onChange: (v: number) => void
  min?: number
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex flex-col">
        <span className="font-bold text-base text-slate-900">{label}</span>
        {sublabel && <span className="text-xs font-medium text-slate-500 mt-0.5">{sublabel}</span>}
      </div>
      <div className="flex items-center justify-between border border-slate-200 rounded-[6px] px-1.5 py-1 w-24 h-10">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="h-full w-7 flex items-center justify-center text-slate-900 hover:bg-slate-100 disabled:opacity-30 rounded-md transition-colors"
        >
          <Minus className="h-3.5 w-3.5 stroke-[3]" />
        </button>
        <span className="w-5 text-center text-base font-bold text-slate-900">{value}</span>
        <button
          onClick={() => onChange(value + 1)}
          className="h-full w-7 flex items-center justify-center text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
        >
          <Plus className="h-3.5 w-3.5 stroke-[3]" />
        </button>
      </div>
    </div>
  )
}

export function SearchBar() {
  // Use a combined DateRange state for a seamless check-in/out experience
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 4),
  })
  
  const [rooms, setRooms] = useState(1)
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(1)
  const navigate = useNavigate()

  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div className="mx-auto w-[92%] sm:w-[90%] md:w-fit max-w-full rounded-[16px] bg-white shadow-xl flex flex-col md:flex-row items-stretch border border-slate-100 h-auto md:h-[90px] lg:h-[100px] z-40 relative">
      
      {/* Combined Dates Popover */}
      <Popover>
        <PopoverTrigger className="flex-1 flex items-stretch h-full">
          <div className="flex-1 w-full flex items-stretch cursor-pointer hover:bg-slate-50 transition-colors rounded-t-[16px] md:rounded-t-none md:rounded-l-[16px] border-b border-slate-100 md:border-b-0 md:border-r">
            {/* Check-In */}
            <div className="flex-1 flex flex-col pt-4 md:pt-5 lg:pt-6 px-4 py-3 md:py-0 md:px-6 border-r border-slate-100">
              <div className="flex items-center text-[10px] md:text-xs font-semibold text-slate-400 gap-1 uppercase tracking-wide whitespace-nowrap">
                Check-In <ChevronDown className="h-3 w-3 text-emerald-500 stroke-[3]" />
              </div>
              <div className="flex items-baseline gap-1 md:gap-1.5 text-slate-900 mt-0.5 whitespace-nowrap">
                <span className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
                  {date?.from ? format(date.from, "d") : "--"}
                </span>
                <span className="text-xs md:text-sm font-semibold">
                  {date?.from ? format(date.from, "MMM yy") : "Select"}
                </span>
              </div>
              <div className="text-[11px] md:text-xs font-medium text-slate-500 hidden sm:block whitespace-nowrap">
                {date?.from ? format(date.from, "EEEE") : "Date"}
              </div>
            </div>

            {/* Check-Out */}
            <div className="flex-1 flex flex-col pt-4 md:pt-5 lg:pt-6 px-4 py-3 md:py-0 md:px-6 border-r-0 md:border-r border-slate-100">
              <div className="flex items-center text-[10px] md:text-xs font-semibold text-slate-400 gap-1 uppercase tracking-wide whitespace-nowrap">
                Check-Out <ChevronDown className="h-3 w-3 text-emerald-500 stroke-[3]" />
              </div>
              <div className="flex items-baseline gap-1 md:gap-1.5 text-slate-900 mt-0.5 whitespace-nowrap">
                <span className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
                  {date?.to ? format(date.to, "d") : "--"}
                </span>
                <span className="text-xs md:text-sm font-semibold">
                  {date?.to ? format(date.to, "MMM yy") : "Select"}
                </span>
              </div>
              <div className="text-[11px] md:text-xs font-medium text-slate-500 hidden sm:block whitespace-nowrap">
                {date?.to ? format(date.to, "EEEE") : "Date"}
              </div>
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 shadow-2xl rounded-2xl" align="start" side="bottom" sideOffset={16} collisionAvoidance={{side: 'none'}}>
          <Calendar
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={(range) => {
              if (range?.from && !range.to) {
                // If only check-in is selected, show check-out as next day
                setDate({ from: range.from, to: addDays(range.from, 1) });
              } else if (range?.from && range.to && range.from.getTime() === range.to.getTime()) {
                // If clicking same date, force next day as checkout
                setDate({ from: range.from, to: addDays(range.from, 1) });
              } else {
                setDate(range);
              }
            }}
            numberOfMonths={isMobile ? 1 : 2}
            initialFocus
            showOutsideDays={false}
            disabled={{ before: new Date() }}
          />
        </PopoverContent>
      </Popover>
      
      {/* Rooms & Guests */}
      <Popover>
        <PopoverTrigger className="flex-1 flex items-stretch h-full">
          <div className="flex-1 w-full flex flex-col pt-4 md:pt-5 lg:pt-6 px-4 py-4 md:py-0 md:px-6 shrink-0 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-100 md:border-none">
            <div className="flex items-center text-[10px] md:text-xs font-semibold text-slate-400 gap-1 uppercase tracking-wide whitespace-nowrap">
              Rooms & Guests <ChevronDown className="h-3 w-3 text-emerald-500 stroke-[3]" />
            </div>
            <div className="flex items-baseline gap-3 md:gap-4 text-slate-900 mt-1 md:mt-0.5 whitespace-nowrap">
              <div className="flex items-baseline gap-1 sm:gap-1.5">
                <span className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">{rooms}</span>
                <span className="text-[10px] md:text-xs font-semibold">Rooms</span>
              </div>
              <div className="flex items-baseline gap-1 sm:gap-1.5">
                <span className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">{adults}</span>
                <span className="text-[10px] md:text-xs font-semibold">Adults</span>
              </div>
              <div className="flex items-baseline gap-1 sm:gap-1.5">
                <span className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">{children}</span>
                <span className="text-[10px] md:text-xs font-semibold">Children</span>
              </div>
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-full max-w-[280px] md:w-[320px] p-4 md:p-5 shadow-2xl rounded-2xl" align="end" side="bottom" sideOffset={8} collisionAvoidance={{side: 'none'}}>
          <div className="flex flex-col gap-1">
            <GuestCounter label="Room" value={rooms} onChange={setRooms} min={1} />
            <GuestCounter label="Adults" value={adults} onChange={setAdults} min={1} />
            <GuestCounter label="Children" sublabel="Above 6 years" value={children} onChange={setChildren} min={0} />
          </div>
        </PopoverContent>
      </Popover>
      
      <button 
        onClick={() => {
          if (!date?.from) return;
          
          const checkOutDate = date.to || addDays(date.from, 1);
          
          const searchParams = new URLSearchParams({
            check_in: format(date.from, "yyyy-MM-dd"),
            check_out: format(checkOutDate, "yyyy-MM-dd"),
            rooms: rooms.toString(),
            adult_count: adults.toString(),
            child_count: children.toString(),
          });
          navigate(`/search?${searchParams.toString()}`);
        }}
        className="w-full py-4 md:py-0 md:w-32 lg:w-48 bg-[#14854F] hover:bg-[#106c40] transition-colors text-lg md:text-xl font-bold tracking-wide flex items-center justify-center text-white cursor-pointer border-none outline-none rounded-b-[16px] md:rounded-bl-none md:rounded-r-[16px]">
        Search
      </button>
    </div>
  )
}
