import { supabase } from '../config/supabase';
import { DaySchedule, ShiftStatus, Note } from '../types/schedule';
import { DatabaseError } from '../utils/errorHandling';

export async function getScheduleForMonth(nurseId: string, year: number, month: number): Promise<DaySchedule[]> {
  try {
    const { data, error } = await supabase
      .from('schedules')
      .select('day, status, notes')
      .eq('nurse_id', nurseId)
      .eq('year', year)
      .eq('month', month)
      .order('day');

    if (error) throw new DatabaseError(error.message, error);

    const daysInMonth = new Date(year, month, 0).getDate();
    const schedule: DaySchedule[] = Array(daysInMonth).fill({ status: 'none', notes: [] });

    data?.forEach(entry => {
      if (entry.day >= 1 && entry.day <= daysInMonth) {
        schedule[entry.day - 1] = {
          status: entry.status as ShiftStatus,
          notes: entry.notes || []
        };
      }
    });

    return schedule;
  } catch (error) {
    console.error('Error fetching schedule:', error);
    throw error;
  }
}

export async function updateScheduleDay(
  nurseId: string,
  year: number,
  month: number,
  day: number,
  status: ShiftStatus,
  notes: Note[]
): Promise<void> {
  try {
    const { error } = await supabase
      .from('schedules')
      .upsert({
        nurse_id: nurseId,
        year,
        month,
        day,
        status,
        notes,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'nurse_id,year,month,day'
      });

    if (error) throw new DatabaseError(error.message, error);
  } catch (error) {
    console.error('Error updating schedule:', error);
    throw error;
  }
}