import { ConvexClient } from "convex/browser";
import { env } from "@/env";

export const convex = new ConvexClient(env.NEXT_PUBLIC_CONVEX_URL);
