import { useQuery } from "@tanstack/react-query";
import { fetchPropertyMedia } from "@/api/property";

const PROPERTY_UUID = "0c4a6143-6f40-440d-90d5-43421956a5e7";

export const usePropertyMedia = () => {
  return useQuery({
    queryKey: ["property-media", PROPERTY_UUID],
    queryFn: () => fetchPropertyMedia(PROPERTY_UUID),
    staleTime: 1000 * 60 * 30, // Media doesn't change often, keep for 30 mins
  });
};
