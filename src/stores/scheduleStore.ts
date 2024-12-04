import { create } from 'zustand';
import { getScheduleForMonth, updateScheduleDay } from '../services/scheduleService';
import { MonthlySchedule, Nurse, ShiftStatus, Note } from '../types/schedule';

interface ScheduleState {
  nurses: Nurse[];
  schedule: MonthlySchedule;
  loading: boolean;
  error: string | null;
  loadData: () => Promise<void>;
  addNurse: (nurse: Nurse) => Promise<void>;
  deleteNurse: (nurseId: string) => Promise<void>;
  updateSchedule: (
    nurseId: string,
    year: number,
    month: number,
    day: number,
    status: ShiftStatus,
    notes: Note[]
  ) => Promise<void>;
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  nurses: [],
  schedule: {},
  loading: false,
  error: null,

  loadData: async () => {
    try {
      set({ loading: true, error: null });

      const { data: nurses, error: nursesError } = await supabase
        .from('nurses')
        .select('*')
        .order('name');

      if (nursesError) throw nursesError;

      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;

      const schedulePromises = nurses.map(async nurse => {
        const schedule = await getScheduleForMonth(nurse.id, year, month);
        return { nurseId: nurse.id, schedule };
      });

      const scheduleResults = await Promise.all(schedulePromises);
      const scheduleData: MonthlySchedule = {};

      scheduleResults.forEach(({ nurseId, schedule }) => {
        scheduleData[`${year}-${month}-${nurseId}`] = schedule;
      });

      set({
        nurses: nurses || [],
        schedule: scheduleData,
        error: null
      });
    } catch (error: any) {
      console.error('Error loading data:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  addNurse: async (nurse: Nurse) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase.from('nurses').insert([nurse]);
      if (error) throw error;
      await get().loadData();
    } catch (error: any) {
      console.error('Error adding nurse:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteNurse: async (nurseId: string) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase.from('nurses').delete().eq('id', nurseId);
      if (error) throw error;
      await get().loadData();
    } catch (error: any) {
      console.error('Error deleting nurse:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateSchedule: async (nurseId, year, month, day, status, notes) => {
    try {
      set({ loading: true, error: null });
      await updateScheduleDay(nurseId, year, month, day, status, notes);
      await get().loadData();
    } catch (error: any) {
      console.error('Error updating schedule:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  }
}));