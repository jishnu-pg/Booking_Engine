import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { ChevronLeft, User, Mail, Phone, CreditCard, ShieldCheck, Users, CalendarDays, Loader2, Building2, Wallet, CheckCircle2 } from "lucide-react";
import { usePropertyMedia } from "@/hooks/usePropertyMedia";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchCheckoutDetails, createBooking } from "@/api/rooms";
import { format, parseISO } from "date-fns";

export function CheckoutPage() {

  const navigate = useNavigate();
  const { data: property } = usePropertyMedia();
  const [searchParams] = useSearchParams();
  
  const roomTypeUuid = searchParams.get("room_type_uuid") || "";
  const mealPlanUuid = searchParams.get("meal_plan_uuid") || "";
  const checkIn = searchParams.get("check_in") || "";
  const checkOut = searchParams.get("check_out") || "";
  const rooms = parseInt(searchParams.get("rooms") || "1");
  const adults = parseInt(searchParams.get("adult") || "2");
  const children = parseInt(searchParams.get("children") || "0");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
  });

  const [errors, setErrors] = useState({
    fullName: "",
    phone: "",
    email: "",
  });

  const [paymentMethod, setPaymentMethod] = useState<"online" | "property" | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [bookingRef, setBookingRef] = useState<string>("");

  // Fetch Checkout Details
  const { data: summary, isLoading: isSummaryLoading, error: summaryError } = useQuery({
    queryKey: ['checkout-details', roomTypeUuid, mealPlanUuid, checkIn, checkOut, rooms, adults, children],
    queryFn: () => fetchCheckoutDetails({
      room_type_uuid: roomTypeUuid,
      meal_plan_uuid: mealPlanUuid,
      check_in: checkIn,
      check_out: checkOut,
      rooms: rooms,
      adult: adults,
      children: children
    }),
    enabled: !!roomTypeUuid && !!mealPlanUuid && !!checkIn && !!checkOut,
  });

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let { name, value } = e.target;

    // Restriction for phone: allow only numbers and limit to 10 digits
    if (name === "phone") {
      value = value.replace(/\D/g, "");
      if (value.length > 10) value = value.slice(0, 10);
    }

    // Restriction for pincode: allow only numbers and limit to 6 digits
    if (name === "pincode") {
      value = value.replace(/\D/g, "");
      if (value.length > 6) value = value.slice(0, 6);
    }

    setFormData((prev) => ({ ...prev, [name]: value }));

    // Reset child fields when parent is cleared
    if (name === "country" && !value) {
      setFormData(prev => ({ ...prev, state: "", district: "" }));
    }
    if (name === "state" && !value) {
      setFormData(prev => ({ ...prev, district: "" }));
    }

    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { 
      fullName: "", phone: "", email: ""
    };

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
      isValid = false;
    }

    const phoneRegex = /^\d{10}$/;
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
      isValid = false;
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
      isValid = false;
    }

    // Email validation (optional but must be valid if entered)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email.trim() && !emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handlePayment = async () => {
    if (!validateForm()) {
      return;
    }

    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    setIsProcessing(true);

    const totalPay = summary?.total_amount || 0;

    if (paymentMethod === "property") {
      try {
        const payload = {
          property_uuid: summary?.property_uuid || "",
          room_type_uuid: roomTypeUuid,
          meal_plan_uuid: mealPlanUuid,
          check_in: checkIn,
          check_out: checkOut,
          adult_count: adults,
          child_count: children,
          rooms: rooms,
          guest_details: {
            name: formData.fullName,
            phone: formData.phone,
            email: formData.email,
          }
        };

        const response = await createBooking(payload);
        
        setIsProcessing(false);
        setBookingRef(response.booking_references.join(", "));
        setShowSuccess(true);
        
        // Wait 2 seconds then redirect to home
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } catch (error: any) {
        console.error("Booking error:", error);
        const errorMessage = error.response?.data?.error || error.response?.data?.message || "Failed to confirm booking. Please try again.";
        toast.error(errorMessage);
        setIsProcessing(false);
      }
      return;
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY, // Use environment variable
      amount: totalPay * 100, // Amount is in currency subunits (paisa for INR)
      currency: "INR",
      name: property?.name || "Bookito",
      description: "Room Booking",
      image: property?.property_logo_url || "/images/resort-logo.jpg",
      handler: function (response: any) {
        setIsProcessing(false);
        alert(`Payment Successful!\nPayment ID: ${response.razorpay_payment_id}\n\nYour booking is being confirmed.`);
        // Note: In a real app, you'd navigate to a success page or verify with backend
      },
      prefill: {
        name: formData.fullName,
        email: formData.email,
        contact: formData.phone,
      },
      notes: {
        address: "Resort Address Placeholder",
        booking_type: "Hotel Stay"
      },
      theme: {
        color: "#14854F",
      },
      modal: {
        ondismiss: function () {
          setIsProcessing(false);
        }
      }
    };

    try {
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Razorpay load error:", error);
      setIsProcessing(false);
      toast.error("Failed to initialize payment gateway. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* ── Header ────────────────────────────────────────────────── */}
      <header className="bg-white sticky top-0 z-50">
        <div className="mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.history.back()}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <ChevronLeft className="h-6 w-6 text-slate-600" />
            </button>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">CHECKOUT</h1>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <div className="flex items-center gap-2 text-emerald-600">
              <div className="bg-emerald-100 p-1 rounded-full"><ShieldCheck className="h-4 w-4" /></div>
              <span className="text-xs font-bold uppercase tracking-wider">Secure Checkout</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full mx-auto px-4 md:px-8 py-6 md:py-12 pb-32 lg:pb-12">
        <div className="flex flex-col lg:flex-row gap-8 md:gap-16">
          {/* ── Left Column: Form ──────────────────────────────────── */}
          <div className="flex-1 space-y-8 order-2 lg:order-1 lg:pr-10 lg:border-r border-slate-100">

            {/* Guest Details Section */}
            <section className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-slate-100">
              <div className="flex items-center mb-2">
                <div className="p-3 rounded-2xl">
                  <User className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Personal Details</h2>
                  <p className="text-sm text-slate-500 font-medium">Please enter your details as per your ID</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Full Name<span className="text-red-500 ml-0.5">*</span></label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      placeholder="Enter full name"
                      className={`w-full pl-11 pr-4 py-4 border ${errors.fullName ? "border-red-500" : "border-black-100"} focus:border-emerald-500 focus:bg-white rounded-2xl outline-none transition-all text-sm font-semibold text-slate-800`}
                      onChange={handleInputChange}
                    />
                  </div>
                  {errors.fullName && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1 uppercase">{errors.fullName}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Phone Number<span className="text-red-500 ml-0.5">*</span></label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      placeholder="Enter Phone Number"
                      className={`w-full pl-11 pr-4 py-4 border ${errors.phone ? "border-red-500" : "border-black-100"} focus:border-emerald-500 focus:bg-white rounded-2xl outline-none transition-all text-sm font-semibold text-slate-800`}
                      onChange={handleInputChange}
                    />
                  </div>
                  {errors.phone && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1 uppercase">{errors.phone}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      placeholder="Enter Your Email"
                      className={`w-full pl-11 pr-4 py-4 border ${errors.email ? "border-red-500" : "border-black-100"} focus:border-emerald-500 focus:bg-white rounded-2xl outline-none transition-all text-sm font-semibold text-slate-800`}
                      onChange={handleInputChange}
                    />
                  </div>
                  {errors.email && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1 uppercase">{errors.email}</p>}
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    placeholder="Enter Full Address"
                    className="w-full px-4 py-4 border border-black-100 focus:border-emerald-500 focus:bg-white rounded-2xl outline-none transition-all text-sm font-semibold text-slate-800"
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </section>
          </div>

          {/* ── Right Column: Summary ─────────────────────────────── */}
          <div className="w-full lg:w-[380px] xl:w-[420px] order-1 lg:order-2">
            <div className="sticky top-32 space-y-6">

              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <h3 className="text-base font-bold text-slate-900 mb-2 px-1">Booking Summary</h3>

                {isSummaryLoading ? (
                  <div className="space-y-4 animate-pulse">
                    <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50/50">
                      <div className="h-10 w-10 rounded-lg bg-slate-200" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-slate-200 rounded w-3/4" />
                        <div className="h-2 bg-slate-200 rounded w-1/2" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-8 bg-slate-50 rounded-xl" />
                      <div className="h-8 bg-slate-50 rounded-xl" />
                    </div>
                    <div className="pt-4 border-t border-slate-100 space-y-2">
                      <div className="h-4 bg-slate-50 rounded" />
                      <div className="h-4 bg-slate-50 rounded" />
                      <div className="h-8 bg-slate-50 rounded mt-2" />
                    </div>
                  </div>
                ) : summaryError ? (
                  <div className="p-4 bg-red-50 rounded-xl text-center">
                    <p className="text-xs font-bold text-red-600 tracking-tight uppercase">Error fetching summary</p>
                    <p className="text-[10px] text-red-500 font-medium mt-1 uppercase">Please refresh and try again</p>
                  </div>
                ) : summary ? (
                  <>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-[#14854F]/5 border border-[#14854F]/10">
                        <div className="h-[72px] w-[72px] rounded-xl overflow-hidden shrink-0 border border-white shadow-sm">
                          <img src={summary.room_type_image} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <p className="text-sm font-black text-slate-900 leading-tight uppercase tracking-tight">{summary.room_type_name}</p>
                          <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-[#14854F]" />
                            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">{summary.meal_plan_name}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 mt-4 space-y-1">
                      <div className="flex items-start gap-3 px-1">
                        <div className="bg-emerald-50 p-2 rounded-xl shrink-0">
                          <CalendarDays className="h-4 w-4 text-[#14854F]" />
                        </div>
                        <div className="flex flex-col">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">Stay Dates</p>
                          <p className="text-[13px] font-bold text-slate-900 leading-tight">
                            {format(parseISO(summary.check_in), "dd MMM yy")} — <span className="text-[#14854F]">{summary.nights} {summary.nights > 1 ? 'Nights' : 'Night'}</span> — {format(parseISO(summary.check_out), "dd MMM yy")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 px-1">
                        <div className="bg-emerald-50 p-2 rounded-xl shrink-0">
                          <Users className="h-4 w-4 text-[#14854F]" />
                        </div>
                        <div className="flex flex-col">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">Occupancy</p>
                          <p className="text-[13px] font-bold text-slate-900 leading-tight">
                            {summary.rooms} {summary.rooms > 1 ? 'Rooms' : 'Room'} • {summary.adult_count} {summary.adult_count > 1 ? 'Adults' : 'Adult'}
                            {summary.child_count > 0 && ` • ${summary.child_count} ${summary.child_count > 1 ? 'Children' : 'Child'}`}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
                      <div className="flex justify-between items-center text-[13px] font-medium text-slate-500">
                        <span>Room Amount</span>
                        <span className="font-bold text-slate-900">₹{summary.room_amount.toLocaleString()}.00</span>
                      </div>
                      <div className="flex justify-between items-center text-[13px] font-medium text-slate-500">
                        <span>Meal Plan</span>
                        <span className="font-bold text-slate-900">₹{summary.meal_plan_amount.toLocaleString()}.00</span>
                      </div>
                      <div className="flex justify-between items-center text-[13px] font-medium text-slate-500 pb-1">
                        <span>GST ({summary.gst_percentage}%)</span>
                        <span className="font-bold text-slate-900">₹{summary.gst_amount.toLocaleString()}.00</span>
                      </div>
                      <div className="flex justify-between items-center text-lg font-black text-[#14854F] mt-2 pt-4 border-t border-dashed border-slate-200">
                        <span className="uppercase tracking-tight">Total Pay</span>
                        <span>₹{summary.total_amount.toLocaleString()}.00</span>
                      </div>
                    </div>
                  </>
                ) : null}

                <div className="mt-4 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900 mb-3 px-1">Payment Method</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("online")}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-center ${
                        paymentMethod === "online"
                          ? "border-emerald-600 bg-emerald-50/30"
                          : "border-slate-100 hover:border-slate-200 bg-white"
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg ${paymentMethod === "online" ? "bg-emerald-600 text-white" : "bg-slate-50 text-slate-500"}`}>
                        <CreditCard className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <p className={`text-[11px] font-bold leading-none ${paymentMethod === "online" ? "text-emerald-900" : "text-slate-900"}`}>Pay Now</p>
                        {paymentMethod === "online" && <CheckCircle2 className="h-3 w-3 text-emerald-600" />}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("property")}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-center ${
                        paymentMethod === "property"
                          ? "border-emerald-600 bg-emerald-50/30"
                          : "border-slate-100 hover:border-slate-200 bg-white"
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg ${paymentMethod === "property" ? "bg-emerald-600 text-white" : "bg-slate-50 text-slate-500"}`}>
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <p className={`text-[11px] font-bold leading-none ${paymentMethod === "property" ? "text-emerald-900" : "text-slate-900"}`}>Pay At Hotel</p>
                        {paymentMethod === "property" && <CheckCircle2 className="h-3 w-3 text-emerald-600" />}
                      </div>
                    </button>
                  </div>
                </div>

                <button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="hidden lg:flex w-full mt-6 bg-[#14854F] hover:bg-[#106c40] disabled:bg-slate-400 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-900/10 transition-all items-center justify-center gap-2.5 active:scale-95 group text-sm">
                  {isProcessing ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : paymentMethod === "online" ? (
                    <CreditCard className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  ) : (
                    <Wallet className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  )}
                  {isProcessing 
                    ? "Confirming Booking..." 
                    : paymentMethod === "online" 
                      ? "Proceed to Pay" 
                      : "Confirm Booking"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Mobile Sticky Footer ────────────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 pb-6 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between gap-4 max-w-lg mx-auto">
          <div className="flex flex-col">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Amount</p>
            <p className="text-xl font-black text-slate-900">₹{summary?.total_amount.toLocaleString() || '0'}</p>
          </div>
          <button
            onClick={handlePayment}
            disabled={isProcessing}
            className="flex-1 bg-[#14854F] hover:bg-[#106c40] disabled:bg-slate-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-900/10 transition-all flex items-center justify-center gap-2 active:scale-95 text-sm">
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              paymentMethod === "online" ? "Pay Now" : "Confirm"
            )}
          </button>
        </div>
      </div>

      {/* ── Success Popup ────────────────────────────────────────── */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-8 md:p-12 max-w-sm w-full shadow-2xl text-center animate-in zoom-in-95 duration-300">
            <div className="mb-6 flex justify-center">
              <div className="bg-emerald-100 p-4 rounded-full animate-bounce">
                <CheckCircle2 className="h-12 w-12 text-emerald-600" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Booking Confirmed!</h2>
            <p className="text-slate-500 font-medium mb-6">
              Your reservation has been successfully placed.
            </p>
            <div className="bg-slate-50 rounded-2xl p-4 mb-2">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Booking Reference</p>
              <p className="text-lg font-black text-emerald-700 tracking-tight">{bookingRef}</p>
            </div>
            <p className="text-[10px] text-slate-400 font-medium italic mt-4">Redirecting to home in 2 seconds...</p>
          </div>
        </div>
      )}
    </div>
  );
}
