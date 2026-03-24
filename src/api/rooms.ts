import apiClient from './client';

export interface MealPlan {
    uuid: string;
    mealplan_name: string | null;
    plan_details: string;
    has_breakfast: boolean;
    has_lunch: boolean;
    has_dinner: boolean;
    daily_rate: number;
    room_type_base_rate: number;
}

export interface SearchRoomResult {
    uuid: string;
    room_type_name: string;
    room_type_image: string;
    room_size: string;
    bed_size: string;
    is_extra_bed: string;
    max_guest: number;
    number_of_bathrooms: number | null;
    is_pool: boolean;
    is_wifi: boolean;
    room_view: string[];
    amenities: string[];
    min_available_rooms: number;
    meal_plans: MealPlan[];
}

export interface CheckoutParams {
    room_type_uuid: string;
    meal_plan_uuid: string;
    rooms: number;
    adult: number;
    children: number;
    check_in: string;
    check_out: string;
}

export interface CheckoutSummary {
    property_uuid: string;
    room_type_uuid: string;
    room_type_name: string;
    room_type_image: string;
    meal_plan_uuid: string;
    meal_plan_name: string;
    check_in: string;
    check_out: string;
    nights: number;
    rooms: number;
    adult_count: number;
    child_count: number;
    room_amount: number;
    meal_plan_amount: number;
    gst_percentage: number;
    gst_amount: number;
    total_amount: number;
}

export interface PaginatedSearchResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: SearchRoomResult[];
    total_pages: number;
    property_uuid: string;
    check_in: string;
    check_out: string;
    adult_count: number;
    child_count: number;
    rooms: number;
}

export interface SearchParams {
    property_uuid: string;
    check_in: string; // YYYY-MM-DD
    check_out: string; // YYYY-MM-DD
    rooms: number;
    adult_count: number;
    child_count: number;
    page?: number;
}

export interface BookingPayload {
    property_uuid: string;
    room_type_uuid: string;
    meal_plan_uuid: string;
    check_in: string;
    check_out: string;
    adult_count: number;
    child_count: number;
    rooms: number;
    guest_details: {
        name: string;
        phone: string;
        email: string;
    };
}

export interface BookingResponse {
    message: string;
    booking_references: string[];
    property_uuid: string;
    room_type_name: string;
    check_in: string;
    check_out: string;
    total_amount: number;
    status: string;
}

export const searchRooms = async (params: SearchParams): Promise<PaginatedSearchResponse> => {
    const { page, ...body } = params;
    const url = page ? `booking-engine/search/?page=${page}` : 'booking-engine/search/';
    const response = await apiClient.post<PaginatedSearchResponse>(url, body);
    return response.data;
};

export const fetchCheckoutDetails = async (params: CheckoutParams): Promise<CheckoutSummary> => {
    const response = await apiClient.post<CheckoutSummary>('booking-engine/checkout-details/', params);
    return response.data;
};

export const createBooking = async (payload: BookingPayload): Promise<BookingResponse> => {
    const response = await apiClient.post<BookingResponse>('booking-engine/create-booking/', payload);
    return response.data;
};
