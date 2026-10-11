import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://butmxdropiechrqapkte.supabase.co';

const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_cdVqZm96XzMAa0Mj3g2R3g_vmCDOk87';

export const createClient = () =>
  createBrowserClient(
    supabaseUrl,
    supabaseKey,
  );
