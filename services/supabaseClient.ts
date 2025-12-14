
import { createClient } from '@supabase/supabase-js';

// Safely retrieve environment variables across different environments (Vite/Node)
const getEnvVar = (key: string): string => {
  try {
    // Check Vite's import.meta.env (Standard for Vite)
    if (typeof import.meta !== 'undefined' && import.meta.env && key in import.meta.env) {
      return import.meta.env[key];
    }
    // Check Node's process.env (Standard for Node/Polyfilled)
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {
    // Ignore access errors in restrictive environments
  }
  return '';
};

// Derived from your connection string: postgresql://...@db.popdghtcttgmxujxnjau.supabase.co...
// In frontend apps, we use the HTTP URL, not the TCP connection string.
const DEFAULT_URL = 'https://popdghtcttgmxujxnjau.supabase.co';
const ANON_KEY = 'sb_publishable_xQksbOfHTvcktEOOealZTQ_fm1oaOOE';

// Access environment variables securely, falling back to your specific project URL
const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || DEFAULT_URL;
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || ANON_KEY;

if (!supabaseAnonKey) {
  console.warn(
    'Supabase Anon Key is missing. The app will load but database requests will fail.\n' + 
    'Please add VITE_SUPABASE_ANON_KEY to your .env file or Vercel deployment settings.'
  );
}

// Initialize client with fallback to empty string to prevent immediate "undefined" crash
export const supabase = createClient(supabaseUrl, supabaseAnonKey || '');
