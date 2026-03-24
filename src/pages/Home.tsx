import { usePropertyMedia } from "@/hooks/usePropertyMedia"
import { SearchBar } from "@/features/search/components/SearchBar"

export function HomePage() {
  const { data: property, isLoading } = usePropertyMedia()

  // Fallback defaults in case API fails
  const logoUrl = property?.property_logo_url || "/images/resort-logo.jpg"
  const heroUrl = property?.property_image_url || "/images/hero-bg.png"

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white font-sans">
        <div className="relative flex flex-col items-center">
          {/* Logo Pulse or Spinner */}
          <div className="mb-8 relative">
             <div className="h-20 w-20 rounded-full border-4 border-slate-50 border-t-[#14854F] animate-spin" />
             <div className="absolute inset-0 flex items-center justify-center">
                 <img src="/favicon.png" alt="Bookito" className="h-6 object-contain opacity-20" />
             </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-2xl font-serif text-[#14854F] tracking-widest animate-pulse uppercase">Loading...</h2>
            <div className="h-[1px] w-12 bg-slate-200" />
            <p className="text-[10px] tracking-[0.3em] font-bold text-slate-400 uppercase">Please wait</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-[#fafafa] flex flex-col relative w-full overflow-hidden font-sans bg-white">
      
      {/* Top Logo Container - Anchored to the very top, centered, overlapping hero */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20">
        <div className="bg-white rounded-b-[16px] md:rounded-b-[20px] shadow-sm flex items-center justify-center p-0 overflow-hidden w-[80px] h-[72px] sm:w-[112px] sm:h-[96px] md:w-[160px] md:h-[160px] xl:w-[176px] xl:h-[176px]">
          <div className="flex flex-col items-center justify-center w-full h-full">
             <>
               <img 
                  src={logoUrl} 
                  alt={property?.name || "Resort Logo"} 
                  className="w-full h-full object-contain" 
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }} 
               />
               <div className="hidden flex-col items-center justify-center text-[#cca462]" style={{display: 'none'}}>
                 <span className="text-xl md:text-3xl tracking-[0.2em] font-light uppercase">{property?.name?.split(' ')[0] || "RESORT"}</span>
               </div>
             </>
          </div>
        </div>
      </div>

      {/* Hero Section - Even sleeker panoramic aspect */}
      <main className="relative w-full aspect-[2/1] md:aspect-[21/6] z-10 overflow-visible bg-slate-100">
        <div className="absolute inset-0 w-full h-full">
          <img 
            src={heroUrl} 
            alt="Hero Background" 
            className="w-full h-full object-cover object-center transition-opacity duration-700 opacity-100" 
            onError={(e) => {
               e.currentTarget.src = "https://images.unsplash.com/photo-1542314831-c6a4d270b28d?q=80&w=3540&auto=format&fit=crop"; 
            }} 
          />
        </div>

        {/* Search Bar centered at the bottom of the hero section */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-1/2 w-full px-4 z-30 flex justify-center">
          <SearchBar />
        </div>
      </main>

      {/* Spacer to account for Search Bar overlap */}
      <div className="h-16 sm:h-20 md:h-14 shrink-0 bg-white"></div>

      {/* Footer Branding Area - Compact for single screen */}
      <footer className="w-full bg-white py-4 md:py-6 flex flex-col items-center justify-center text-center mt-auto shrink-0">
        <p className="text-xs font-semibold text-slate-500 mb-2 tracking-wide">Powered By :</p>
        
        <img 
          src="/images/bookito-logo.png" 
          alt="Bookito" 
          className="h-10 md:h-12 object-contain"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
        
        <div className="hidden flex-col items-center justify-center text-[#14854F]" style={{display: 'none'}}>
          <h2 className="text-4xl tracking-tight" style={{ fontFamily: "'Abigail DEMO', serif" }}>Bookito</h2>
          <p className="text-[8px] tracking-widest font-bold mt-1">BOOK SMART . MANAGE SMART</p>
        </div>
      </footer>
    </div>
  )
}
