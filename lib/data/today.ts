import "server-only";
import { cacheLife } from "next/cache";
import { todayInIndia } from "@/lib/offer";

/** Today's date in India (YYYY-MM-DD) for pages; refreshed hourly so offer dates switch on time. */
export async function getTodayInIndia(): Promise<string> {
  "use cache";
  cacheLife("hours");
  return todayInIndia();
}
