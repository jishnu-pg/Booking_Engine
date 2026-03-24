import apiClient from './client';

export interface PropertyMedia {
    uuid: string;
    name: string;
    property_logo_url: string;
    property_image_url: string;
}

export const fetchPropertyMedia = async (propertyUuid: string): Promise<PropertyMedia> => {
    const response = await apiClient.get<PropertyMedia>(`booking-engine/property-media/${propertyUuid}/`);
    return response.data;
};
