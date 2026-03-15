
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
const DEFAULT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvcGRnaHRjdHRnbXh1anhuamF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3Mjc1OTYsImV4cCI6MjA4MTMwMzU5Nn0.UWD3UR07OkZj58QkFgsHPZC4QUDBCkYAZFajaoDf5NY';

// Access environment variables securely, falling back to your specific project credentials
const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || DEFAULT_URL;
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || DEFAULT_ANON_KEY;

if (!supabaseAnonKey) {
  console.warn(
    'Supabase Anon Key is missing. The app will load but database requests will fail.\n' + 
    'Please add VITE_SUPABASE_ANON_KEY to your .env file or Vercel deployment settings.'
  );
}

// Initialize client with fallback to empty string to prevent immediate "undefined" crash
export const supabase = createClient(supabaseUrl, supabaseAnonKey || '');

// Log configuration for debugging
console.log('🔧 Supabase Client Configuration:', {
  url: supabaseUrl,
  anonKey: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'MISSING',
  hasKey: !!supabaseAnonKey
});

// Test connection on initialization
supabase.from('users').select('count(*)', { count: 'exact', head: true }).then(({ error }) => {
  if (error) {
    console.error('❌ Supabase connection test failed:', error);
  } else {
    console.log('✅ Supabase connection test successful');
  }
}).catch(err => {
  console.error('🚨 Supabase connection test exception:', err);
});
