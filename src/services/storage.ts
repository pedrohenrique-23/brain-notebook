import { SleepLog } from '../types';

// Função auxiliar para obter data local em YYYY-MM-DD
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ==========================================================================
// ESTATÍSTICAS DO SONO
// ==========================================================================

export interface SleepStats {
  averageHours: number;
  averageFormatted: string;
  totalLogs: number;
  latestHours: number | null;
  latestDate: string | null;
  bestHours: number;
  lowestHours: number;
  goalMetPercent: number; // Porcentagem que dormiu 7h ou mais
}

export function calculateSleepStats(logs: SleepLog[]): SleepStats {
  if (logs.length === 0) {
    return {
      averageHours: 0,
      averageFormatted: '0h',
      totalLogs: 0,
      latestHours: null,
      latestDate: null,
      bestHours: 0,
      lowestHours: 0,
      goalMetPercent: 0,
    };
  }

  const hoursArr = logs.map((l) => l.hours);
  const total = hoursArr.reduce((acc, h) => acc + h, 0);
  const avg = Number((total / logs.length).toFixed(1));
  const avgHoursInt = Math.floor(avg);
  const avgMins = Math.round((avg - avgHoursInt) * 60);

  const best = Math.max(...hoursArr);
  const lowest = Math.min(...hoursArr);
  const goalMetCount = hoursArr.filter((h) => h >= 7 && h <= 9.5).length;
  const goalMetPercent = Math.round((goalMetCount / logs.length) * 100);

  return {
    averageHours: avg,
    averageFormatted: `${avgHoursInt}h ${avgMins > 0 ? `${avgMins}m` : ''}`.trim(),
    totalLogs: logs.length,
    latestHours: logs[0]?.hours ?? null,
    latestDate: logs[0]?.date ?? null,
    bestHours: best,
    lowestHours: lowest,
    goalMetPercent,
  };
}
