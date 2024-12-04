import { supabase } from '../config/supabase';
import { User } from '../types/auth';
import { DatabaseError } from '../utils/errorHandling';

export async function getUsers(): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('username');
    
    if (error) throw new DatabaseError(error.message, error);
    return data || [];
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

export async function createUser(userData: Omit<User, 'id' | 'created_at'>): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([{
        username: userData.username,
        password: userData.password,
        role: userData.role,
      }])
      .select('id')
      .single();
    
    if (error) throw new DatabaseError(error.message, error);
    if (!data) throw new Error('No data returned after insert');
    
    return data.id;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

export async function validateUser(username: string, password: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username.toLowerCase())
      .eq('password', password)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new DatabaseError(error.message, error);
    }
    return data;
  } catch (error) {
    console.error('Error validating user:', error);
    throw error;
  }
}