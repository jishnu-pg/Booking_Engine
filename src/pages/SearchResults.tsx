import { useState, useEffect } from "react"
import { format, addDays, parseISO } from "date-fns"
import type { DateRange } from "react-day-picker"
import { Minus, Plus, Clock, ChevronLeft, ChevronRight } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { useQuery } from "@tanstack/react-query"
import { usePropertyMedia } from "@/hooks/usePropertyMedia"
import { searchRooms } from "@/api/rooms"
import type { SearchRoomResult, MealPlan as ApiMealPlan } from "@/api/rooms"
import { useSearchParams } from "react-router-dom"

// ─── Inline Counter (reused in the top bar guest popover) ─────────────────────
function GuestCounter({ label, sublabel, value, onChange, min = 0 }: {
  label: string; sublabel?: string; value: number; onChange: (v: number) => void; min?: number
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex flex-col">
        <span className="font-bold text-sm text-slate-900">{label}</span>
        {sublabel && <span className="text-[11px] font-medium text-slate-500">{sublabel}</span>}
      </div>
      <div className="flex items-center border border-slate-200 rounded-md px-1 w-20 h-8">
        <button onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}
          className="flex-1 flex items-center justify-center text-slate-900 disabled:opacity-30">
          <Minus className="h-3 w-3 stroke-[3]" />
        </button>
        <span className="w-5 text-center text-sm font-bold text-slate-900">{value}</span>
        <button onClick={() => onChange(value + 1)}
          className="flex-1 flex items-center justify-center text-slate-900">
          <Plus className="h-3 w-3 stroke-[3]" />
        </button>
      </div>
    </div>
  )
}

interface CartItem {
  id: string
  roomName: string
  planName: string
  price: number
  roomId: string
  planId: string
}

// ─── Single Meal Plan Row ─────────────────────────────────────────────────────
function MealPlanRow({ plan, roomName, roomId, onAdd, isAvailable }: {
  plan: ApiMealPlan;
  roomName: string;
  roomId: string;
  onAdd: (item: CartItem) => void;
  isAvailable: boolean;
}) {
  return (
    <div className={`flex flex-col lg:flex-row lg:items-start justify-between pt-3 pb-3 border-b border-slate-500 last:border-b-0 gap-4 ${!isAvailable ? 'opacity-50 grayscale select-none' : ''}`}>
      {/* Left: Plan Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-xl font-extrabold text-slate-900 leading-none">{plan.mealplan_name || 'Standard Plan'}</h4>
        <p className="text-sm text-[#14854F] font-extrabold mt-1">{plan.plan_details}</p>

        {/* Includes Tags */}
        <div className="flex flex-wrap items-center gap-x-12 gap-y-2 mt-4">
             <span className="text-[13px] font-bold text-slate-500">
               Room : <span className="text-[#14854F] ml-1">YES</span>
             </span>

             {plan.has_breakfast && (
               <span className="text-[13px] font-bold text-slate-500">
                 Breakfast : <span className="text-[#14854F] ml-1">YES</span>
               </span>
             )}

             {(plan.has_lunch || plan.has_dinner) && (
               <span className="text-[13px] font-bold text-slate-500">
                 Lunch or Dinner : <span className="text-[#14854F] ml-1">YES</span>
               </span>
             )}
        </div>

        {/* Refund Policy with Clock Icon */}
        <div className="flex items-center gap-1.5 mt-3">
          <Clock className="h-3 w-3 text-slate-400" />
          <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
            This booking is non-refundable and the tariff cannot be cancelled with zero fee.
          </p>
        </div>
      </div>

      {/* Right: Price + CTA */}
      <div className="flex flex-col items-start gap-1 shrink-0 border-l border-slate-400 pl-10 min-w-[240px]">
        <div className="flex flex-col gap-1.5">
          <p className="text-[15px] text-[#14854F] font-bold">Per Night</p>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-slate-900 leading-none tracking-tight">₹{plan.daily_rate}</span>
            {plan.room_type_base_rate > plan.daily_rate && (
              <span className="text-2xl font-bold text-slate-300 line-through decoration-[#FF0000] decoration-2">
                ₹{plan.room_type_base_rate}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => isAvailable && onAdd({
            id: `${roomId}-${plan.uuid}-${Math.random()}`,
            roomName,
            planName: plan.mealplan_name || 'Standard Plan',
            price: plan.daily_rate,
            roomId,
            planId: plan.uuid
          })}
          disabled={!isAvailable}
          className={`w-full ${isAvailable ? 'bg-[#14854F] hover:bg-[#106c40]' : 'bg-slate-400 cursor-not-allowed'} text-white font-black text-[13px] uppercase tracking-wider py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm shadow-emerald-900/10 active:scale-95`}>
          {isAvailable ? 'Book Now' : 'Sold Out'}
        </button>
      </div>
    </div>
  )
}

// ─── Room Listing Card ────────────────────────────────────────────────────────
function RoomListingCard({ room, onAdd }: { room: SearchRoomResult; onAdd: (item: CartItem) => void }) {
  return (
    <div className="bg-white rounded-xl border border-slate-400 shadow-sm overflow-hidden flex flex-col lg:flex-row">
      {/* Left: Room Info */}
      <div className="lg:w-[350px] xl:w-[410px] p-5 shrink-0">
        {/* Image Box */}
        <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-6 group">
          <img src={room.room_type_image} alt={room.room_type_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        </div>

        <h3 className="text-3xl font-black text-slate-900 tracking-tight">{room.room_type_name}</h3>
        <p className={`${room.min_available_rooms > 0 ? 'text-[#14854F]' : 'text-red-600'} text-base font-bold mt-1`}>
          {room.min_available_rooms === 0 ? "0 Rooms Available" : `${room.min_available_rooms} Rooms Available`}
        </p>

        <p className="text-xs text-slate-400 font-medium mt-3 leading-relaxed">
          Experience luxury and comfort in our meticulously designed {room.room_type_name}.
        </p>

        {/* Specs Grid */}
        <div className="grid grid-cols-2 gap-y-2.5 mt-6 border-slate-100">
          <div className="text-[13px] font-bold text-slate-500">Room Size : <span className="text-[#14854F]">{room.room_size} sq.ft</span></div>
          <div className="text-[13px] font-bold text-slate-500 text-right lg:text-left">Max - Guests : <span className="text-[#14854F]">{room.max_guest}</span></div>
          <div className="text-[13px] font-bold text-slate-500">Bed : <span className="text-[#14854F]">{room.bed_size}</span></div>
          <div className="text-[13px] font-bold text-slate-500 text-right lg:text-left">No of Bathroom : <span className="text-[#14854F]">{room.number_of_bathrooms || '1'}</span></div>
          <div className="text-[13px] font-bold text-slate-500">Extra Bed : <span className="text-[#14854F]">{room.is_extra_bed}</span></div>
          <div className="text-[13px] font-bold text-slate-500 text-right lg:text-left">WiFi : <span className={room.is_wifi ? "text-[#14854F]" : "text-red-400"}>{room.is_wifi ? "Yes" : "No"}</span></div>
          <div className="text-[13px] font-bold text-slate-500">Swimming Pool : <span className={room.is_pool ? "text-[#14854F]" : "text-red-400"}>{room.is_pool ? "Yes" : "No"}</span></div>
          <div className="text-[13px] font-bold text-slate-500 text-right lg:text-left truncate">Room Views : <span className="text-[#14854F]">{room.room_view && room.room_view.length > 0 ? room.room_view.join(', ') : 'N/A'}</span></div>
        </div>
        
        {/* Bottom Note */}
        <div className="flex items-center gap-1.5 mt-8 opacity-60">
          <Clock className="h-3 w-3 text-slate-400" />
          <p className="text-[10px] text-slate-400 font-bold leading-relaxed tracking-tight">
            This booking is non-refundable and the tariff cannot be cancelled with zero fee.
          </p>
        </div>
      </div>

      <div className="flex-1 border-l border-slate-100 px-8 py-2">
        {room.meal_plans.map((plan) => (
          <MealPlanRow 
            key={plan.uuid} 
            plan={plan} 
            roomName={room.room_type_name} 
            roomId={room.uuid} 
            onAdd={onAdd}
            isAvailable={room.min_available_rooms > 0}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Room Card Skeleton ─────────────────────────────────────────────────────
function RoomCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col lg:flex-row animate-pulse">
      {/* Left: Image Skeleton */}
      <div className="lg:w-[350px] xl:w-[410px] p-5 shrink-0">
        <div className="aspect-[4/3] rounded-xl bg-slate-100 mb-6" />
        <div className="h-8 bg-slate-100 rounded w-3/4 mb-4" />
        <div className="h-4 bg-slate-100 rounded w-1/2 mb-6" />
        <div className="space-y-3">
          <div className="h-3 bg-slate-100 rounded w-full" />
          <div className="h-3 bg-slate-100 rounded w-5/6" />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-8">
          <div className="h-4 bg-slate-100 rounded w-full" />
          <div className="h-4 bg-slate-100 rounded w-full" />
          <div className="h-4 bg-slate-100 rounded w-full" />
          <div className="h-4 bg-slate-100 rounded w-full" />
        </div>
      </div>
      {/* Right: Meal Plan Skeleton */}
      <div className="flex-1 border-l border-slate-50 px-8 py-8 space-y-8">
        {[1, 2].map((i) => (
          <div key={i} className="flex justify-between items-start gap-4">
            <div className="flex-1 space-y-3">
              <div className="h-6 bg-slate-100 rounded w-1/2" />
              <div className="h-4 bg-slate-100 rounded w-1/3" />
            </div>
            <div className="w-40 space-y-3">
              <div className="h-8 bg-slate-100 rounded w-full" />
              <div className="h-10 bg-slate-100 rounded w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Search Results Page ──────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
export function SearchResultsPage() {
  const [searchParams] = useSearchParams()
  const { data: property } = usePropertyMedia()
  
  // Extract search params
  const checkIn = searchParams.get("check_in") || format(addDays(new Date(), 1), "yyyy-MM-dd")
  const checkOut = searchParams.get("check_out") || format(addDays(new Date(), 3), "yyyy-MM-dd")
  const roomsCount = parseInt(searchParams.get("rooms") || "1")
  const adultsCount = parseInt(searchParams.get("adult_count") || "2")
  const childrenCount = parseInt(searchParams.get("child_count") || "0")

  const [date, setDate] = useState<DateRange | undefined>({
    from: parseISO(checkIn),
    to: parseISO(checkOut),
  })
  const [rooms, setRooms] = useState(roomsCount)
  const [adults, setAdults] = useState(adultsCount)
  const [children, setChildren] = useState(childrenCount)
  const [page, setPage] = useState(1)
  const [isMobile, setIsMobile] = useState(false)

  const { data: searchResults, isLoading: isSearchLoading, isPlaceholderData } = useQuery({
    queryKey: ['search-rooms', property?.uuid, checkIn, checkOut, roomsCount, adultsCount, childrenCount, page],
    queryFn: () => searchRooms({
      property_uuid: property?.uuid || "",
      check_in: checkIn,
      check_out: checkOut,
      rooms: roomsCount,
      adult_count: adultsCount,
      child_count: childrenCount,
      page: page,
    }),
    enabled: !!property?.uuid,
    placeholderData: (previousData) => previousData,
  })

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  // Sync search bar state with API response
  useEffect(() => {
    if (searchResults) {
      if (searchResults.check_in && searchResults.check_out) {
        setDate({
          from: parseISO(searchResults.check_in),
          to: parseISO(searchResults.check_out)
        });
      }
      setRooms(searchResults.rooms);
      setAdults(searchResults.adult_count);
      setChildren(searchResults.child_count);
    }
  }, [searchResults]);

  const addToCart = (item: CartItem) => {
    const params = new URLSearchParams({
      room_type_uuid: item.roomId,
      meal_plan_uuid: item.planId,
      check_in: searchResults?.check_in ?? checkIn,
      check_out: searchResults?.check_out ?? checkOut,
      rooms: (searchResults?.rooms ?? roomsCount).toString(),
      adult: (searchResults?.adult_count ?? adultsCount).toString(),
      children: (searchResults?.child_count ?? childrenCount).toString(),
    });
    window.location.href = `/checkout?${params.toString()}`;
  }

  const logoUrl = property?.property_logo_url || "/images/resort-logo.jpg"

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">

      {/* ── Top Search Bar ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 pt-2 pb-2 bg-white">
        <div className="mx-auto flex items-center h-[72px] px-4 md:px-8">

          {/* Logo Container - matched with room info width */}
          <div className="lg:w-[350px] xl:w-[410px] shrink-0 flex items-center">
            <a href="/" className="shrink-0">
              <img src={logoUrl} alt={property?.name || "Property Logo"} className="h-14 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none"
                  const f = e.currentTarget.nextElementSibling as HTMLElement
                  if (f) f.style.display = "flex"
                }} />
              <div className="hidden flex-col items-center" style={{ display: "none" }}>
                <span className="text-2xl font-serif text-[#b8943e] tracking-tight leading-none uppercase">{property?.name?.split(' ')[0] || "RESORT"}</span>
                <span className="text-[7px] tracking-[0.25em] text-[#b8943e] font-medium">PROPERTY</span>
              </div>
            </a>
          </div>

          {/* Search Container — slightly rounded rectangle border */}
          <div className="hidden md:flex items-center border border-slate-200 rounded-lg h-[70px] overflow-hidden ml-8">

            {/* Check-In */}
            <Popover>
              <PopoverTrigger>
                <div className="flex flex-col justify-center px-6 cursor-pointer hover:bg-slate-50 transition-colors h-full">
                  <span className="text-[10px] text-slate-400 font-medium leading-none uppercase">Check-In</span>
                  <span className="text-sm font-medium text-slate-800 leading-snug mt-1">{date?.from ? format(date.from, "dd MMM yy") : "Select"}</span>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 shadow-2xl rounded-2xl" align="start" side="bottom" sideOffset={12} collisionAvoidance={{ side: "none" }}>
                <Calendar 
                  mode="range" 
                  defaultMonth={date?.from} 
                  selected={date} 
                  onSelect={(range) => {
                    if (range?.from && !range.to) {
                      setDate({ from: range.from, to: addDays(range.from, 1) });
                    } else if (range?.from && range.to && range.from.getTime() === range.to.getTime()) {
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

            {/* Check-Out */}
            <Popover>
              <PopoverTrigger>
                <div className="flex flex-col justify-center px-6 cursor-pointer hover:bg-slate-50 transition-colors h-full border-l border-slate-100">
                  <span className="text-[10px] text-slate-400 font-medium leading-none uppercase">Check-Out</span>
                  <span className="text-sm font-medium text-slate-800 leading-snug mt-1">{date?.to ? format(date.to, "dd MMM yy") : "Select"}</span>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 shadow-2xl rounded-2xl" align="center" side="bottom" sideOffset={12} collisionAvoidance={{ side: "none" }}>
                <Calendar 
                  mode="range" 
                  defaultMonth={date?.from} 
                  selected={date} 
                  onSelect={(range) => {
                    if (range?.from && !range.to) {
                      setDate({ from: range.from, to: addDays(range.from, 1) });
                    } else if (range?.from && range.to && range.from.getTime() === range.to.getTime()) {
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
              <PopoverTrigger>
                <div className="flex flex-col justify-center px-6 cursor-pointer hover:bg-slate-50 transition-colors h-full border-l border-slate-100">
                  <span className="text-[10px] text-slate-400 font-medium leading-none uppercase">Rooms & Guests</span>
                  <span className="text-sm font-medium text-slate-800 leading-snug mt-1">{rooms} Room {adults} A {children} C</span>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-4 shadow-2xl rounded-2xl" align="end" side="bottom" sideOffset={12} collisionAvoidance={{ side: "none" }}>
                <div className="flex flex-col gap-2">
                  <GuestCounter label="Room" value={rooms} onChange={setRooms} min={1} />
                  <GuestCounter label="Adults" value={adults} onChange={setAdults} min={1} />
                  <GuestCounter label="Children" sublabel="Above 6 years" value={children} onChange={setChildren} min={0} />
                </div>
              </PopoverContent>
            </Popover>

            {/* Search Button — green rounded rectangle inside the container */}
            <div className="flex items-center px-4">
              <button 
                onClick={() => {
                  if (!date?.from) return;
                  
                  const checkOutDate = date.to || addDays(date.from, 1);
                  
                  const newParams = new URLSearchParams({
                    check_in: format(date.from, "yyyy-MM-dd"),
                    check_out: format(checkOutDate, "yyyy-MM-dd"),
                    rooms: rooms.toString(),
                    adult_count: adults.toString(),
                    child_count: children.toString(),
                  });
                  window.location.search = newParams.toString();
                }}
                className="bg-[#14854F] hover:bg-[#106c40] text-white font-bold text-sm tracking-wide px-8 py-2.5 rounded-lg transition-colors">
                Search
              </button>
            </div>
          </div>

          <div className="flex-1 md:hidden" />

          {/* Mobile: compact row */}
          <div className="flex md:hidden items-center gap-2 text-slate-700 border border-slate-200 rounded-lg px-2 py-1.5">

            {/* Mobile Date Trigger */}
            <Popover>
              <PopoverTrigger>
                <div className="cursor-pointer hover:bg-slate-50 px-2 py-1 rounded-md transition-colors">
                  <span className="font-bold text-[11px] whitespace-nowrap">
                    {date?.from ? format(date.from, "dd MMM") : "--"} → {date?.to ? format(date.to, "dd MMM") : "--"}
                  </span>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 shadow-2xl rounded-2xl" align="center" side="bottom" sideOffset={12}>
                <Calendar 
                  mode="range" 
                  defaultMonth={date?.from} 
                  selected={date} 
                  onSelect={(range) => {
                    if (range?.from && !range.to) {
                      setDate({ from: range.from, to: addDays(range.from, 1) });
                    } else if (range?.from && range.to && range.from.getTime() === range.to.getTime()) {
                      setDate({ from: range.from, to: addDays(range.from, 1) });
                    } else {
                      setDate(range);
                    }
                  }}
                  numberOfMonths={1} 
                  initialFocus 
                  showOutsideDays={false} 
                  disabled={{ before: new Date() }}
                />
              </PopoverContent>
            </Popover>

            <span className="text-slate-300 text-[11px]">|</span>

            {/* Mobile Guest Trigger */}
            <Popover>
              <PopoverTrigger>
                <div className="cursor-pointer hover:bg-slate-50 px-2 py-1 rounded-md transition-colors">
                  <span className="font-bold text-[11px] whitespace-nowrap">
                    {rooms}R · {adults}A · {children}C
                  </span>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-4 shadow-2xl rounded-2xl" align="center" side="bottom" sideOffset={12}>
                <div className="flex flex-col gap-2">
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
                
                const newParams = new URLSearchParams({
                  check_in: format(date.from, "yyyy-MM-dd"),
                  check_out: format(checkOutDate, "yyyy-MM-dd"),
                  rooms: rooms.toString(),
                  adult_count: adults.toString(),
                  child_count: children.toString(),
                });
                window.location.search = newParams.toString();
              }}
              className="ml-1 bg-[#14854F] hover:bg-[#106c40] text-white font-black text-[10px] uppercase tracking-tight px-3 py-2 rounded-lg whitespace-nowrap transition-all active:scale-95 shadow-sm shadow-emerald-900/10"
            >
              Search
            </button>
          </div>

        </div>
      </header>


      {/* ── Room Listings ───────────────────────────────────────────────── */}
      <main className="flex-1 w-full mx-auto px-4 md:px-8 py-8 md:py-12 pb-32">
        {isSearchLoading || !searchResults ? (
            <div className="flex flex-col gap-8 md:gap-10">
              {[1, 2, 3].map((i) => (
                <RoomCardSkeleton key={i} />
              ))}
            </div>
        ) : searchResults.results.length > 0 ? (
          <div className="flex flex-col gap-8 md:gap-10">
            <div className="flex flex-col gap-8 md:gap-10">
              {searchResults.results.map((room) => (
                <RoomListingCard key={room.uuid} room={room} onAdd={addToCart} />
              ))}
            </div>

            {/* Pagination Controls */}
            {searchResults.total_pages > 1 && (
              <div className={`flex items-center justify-between pt-8 border-t border-slate-100 ${isPlaceholderData ? 'opacity-50 pointer-events-none' : ''}`}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={!searchResults.previous || isPlaceholderData}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                    searchResults.previous 
                      ? 'text-slate-700 hover:bg-slate-50 border border-slate-200' 
                      : 'text-slate-300 border border-slate-100 cursor-not-allowed'
                  }`}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-400">Page</span>
                  <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#14854F]/5 text-[#14854F] font-black text-sm border border-[#14854F]/10">
                    {page}
                  </span>
                  <span className="text-sm font-bold text-slate-400">of {searchResults.total_pages}</span>
                </div>

                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={!searchResults.next || isPlaceholderData}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                    searchResults.next 
                      ? 'bg-[#14854F] text-white hover:bg-[#106c40] shadow-sm shadow-emerald-900/10' 
                      : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                  }`}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
            <div className="text-center py-20">
                <h3 className="text-2xl font-black text-slate-900">No rooms found</h3>
                <p className="text-slate-500 mt-2">Try adjusting your dates or guest count.</p>
            </div>
        )}
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="w-full py-10 flex flex-col items-center justify-center text-center bg-white mt-auto">
        <p className="text-sm font-semibold text-slate-500 mb-3 tracking-wide">Powered By :</p>
        <img src="/images/bookito-logo.png" alt="Bookito" className="h-10 object-contain"
          onError={(e) => {
            e.currentTarget.style.display = "none"
            const f = e.currentTarget.nextElementSibling as HTMLElement
            if (f) f.style.display = "flex"
          }} />
        <div className="hidden flex-col items-center text-[#14854F]" style={{ display: "none" }}>
          <h2 className="text-4xl font-serif tracking-tight">Bookito</h2>
          <p className="text-[9px] tracking-widest font-bold mt-1">BOOK SMART · MANAGE SMART</p>
        </div>
      </footer>
    </div>
  )
}
