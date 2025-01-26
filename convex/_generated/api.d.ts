/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as animations from "../animations.js";
import type * as clerk from "../clerk.js";
import type * as crons from "../crons.js";
import type * as emails from "../emails.js";
import type * as events from "../events.js";
import type * as holidays from "../holidays.js";
import type * as http from "../http.js";
import type * as recipients from "../recipients.js";
import type * as scheduledEmails from "../scheduledEmails.js";
import type * as subscriptions from "../subscriptions.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  animations: typeof animations;
  clerk: typeof clerk;
  crons: typeof crons;
  emails: typeof emails;
  events: typeof events;
  holidays: typeof holidays;
  http: typeof http;
  recipients: typeof recipients;
  scheduledEmails: typeof scheduledEmails;
  subscriptions: typeof subscriptions;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
