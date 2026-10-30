/**
 * Supabase Authentication - Production-ready auth system
 * 
 * Features:
 * - Secure password hashing (bcrypt on server)
 * - JWT tokens with refresh
 * - Email verification
 * - Password reset
 * - Session management
 * - OAuth providers (Google, GitHub)
 */

import { createClient } from '@supabase/supabase-js';

// Supabase credentials (from environment variables)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  credits: number;
  created_at: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: AuthUser;
}

/**
 * Sign up new user
 */
export async function signUp(email: string, password: string, name: string): Promise<{
  success: boolean;
  user?: AuthUser;
  error?: string;
}> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          credits: 50, // Free tier
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: 'Failed to create user' };
    }

    return {
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata.name,
        credits: data.user.user_metadata.credits || 50,
        created_at: data.user.created_at,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Sign in existing user
 */
export async function signIn(email: string, password: string): Promise<{
  success: boolean;
  session?: AuthSession;
  error?: string;
}> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data.session || !data.user) {
      return { success: false, error: 'Failed to sign in' };
    }

    return {
      success: true,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at!,
        user: {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata.name,
          credits: data.user.user_metadata.credits || 50,
          created_at: data.user.created_at,
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Sign in with OAuth provider
 */
export async function signInWithOAuth(provider: 'google' | 'github'): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin + '/auth/callback',
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get current session
 */
export async function getSession(): Promise<AuthSession | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session || !session.user) {
      return null;
    }

    return {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at!,
      user: {
        id: session.user.id,
        email: session.user.email!,
        name: session.user.user_metadata.name,
        credits: session.user.user_metadata.credits || 50,
        created_at: session.user.created_at,
      },
    };
  } catch (error) {
    return null;
  }
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email!,
      name: user.user_metadata.name,
      credits: user.user_metadata.credits || 50,
      created_at: user.created_at,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Reset password
 */
export async function resetPassword(email: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/auth/reset-password',
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Update password
 */
export async function updatePassword(newPassword: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Update user profile
 */
export async function updateProfile(updates: { name?: string; avatar_url?: string }): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { error } = await supabase.auth.updateUser({
      data: updates,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Update user credits
 */
export async function updateCredits(userId: string, credits: number): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ credits })
      .eq('id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (event: string, session: AuthSession | null) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
      callback(event, {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at!,
        user: {
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata.name,
          credits: session.user.user_metadata.credits || 50,
          created_at: session.user.created_at,
        },
      });
    } else {
      callback(event, null);
    }
  });
}
