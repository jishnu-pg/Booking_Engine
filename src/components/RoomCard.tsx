import { ArrowRight } from "lucide-react"

interface RoomProps {
  image: string
  title: string
  price: number
  description: string
}

export function RoomCard({ image, title, price, description }: RoomProps) {
  return (
    <div className="group bg-white rounded-[24px] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-slate-100 flex flex-col h-full">
      {/* Image Container with Zoom Effect */}
      <div className="relative h-[240px] overflow-hidden">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
        />
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-sm">
          <span className="text-sm font-bold text-slate-900">₹{price.toLocaleString()}</span>
          <span className="text-[10px] text-slate-500 font-medium ml-1">/ Night</span>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6 flex-1 flex flex-col">
        <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-slate-500 line-clamp-2 mb-6 leading-relaxed">
          {description}
        </p>

        {/* Action Button */}
        <button className="mt-auto w-full py-3.5 bg-slate-50 hover:bg-emerald-600 hover:text-white text-slate-900 rounded-[12px] font-bold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 group-hover:bg-emerald-600 group-hover:text-white">
          Book Now <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
