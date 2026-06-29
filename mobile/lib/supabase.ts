import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

/**
 * Supabase client for the mobile app. Reads the public URL + anon key from
 * EXPO_PUBLIC_* env vars (see .env.example). Sessions persist in AsyncStorage.
 * This talks to the SAME backend as the web app — RLS enforces tenant isolation.
 */
const extra = Constants.expoConfig?.extra ?? {};
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? (extra.supabaseUrl as string) ?? "";
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  (extra.supabaseAnonKey as string) ??
  "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
