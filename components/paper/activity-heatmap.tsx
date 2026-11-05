import type { ActivityCalendar } from "@/lib/services/activity-service";

/**
 * Heatmap aktivitas harian: satu kolom per minggu (Senin di atas), warna makin pekat makin banyak
 * jawaban task dan attempt quiz hari itu. Tanggal memakai hari lokal server, sama dengan perhitungan streak.
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Ambang tetap agar warna sel tidak berubah makna saat hari tersibuk bertambah.
// Satu room ≈ 2–3 jawaban task + 1 quiz, jadi 5+ aktivitas sehari sudah termasuk hari yang padat.
// Hari tanpa aktivitas digambar sebagai titik kecil berwarna control-edge (>= 3:1): beda dari kotak hari aktif lewat
// bentuk, bukan hanya warna samar, dan tidak seramai kisi kotak bergaris (selaras dengan motif grid titik di rail).
const LEVELS = ["bg-[radial-gradient(circle,rgb(var(--line-input))_1.5px,transparent_2px)]", "bg-cyan-ink/25", "bg-cyan-ink/45", "bg-cyan-ink/70", "bg-cyan-ink"];

function level(count: number) {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count <= 4) return 3;
  return 4;
}

function describe(day: { date: Date; count: number }) {
  const date = `${WEEKDAYS[(day.date.getDay() + 6) % 7].slice(0, 3)}, ${day.date.getDate()} ${MONTHS[day.date.getMonth()]}`;
  if (day.count === 0) return `No activity · ${date}`;
  return `${day.count} ${day.count === 1 ? "activity" : "activities"} · ${date}`;
}

export function ActivityHeatmap({ calendar, className = "" }: { calendar: ActivityCalendar; className?: string }) {
  const { weeks } = calendar;
  const lastWeek = weeks.length - 1;

  // Label bulan di kolom yang memuat tanggal 1; kolom pertama hanya diberi label bila bulan berikutnya cukup jauh.
  const monthLabels = weeks.map((week, index) => {
    const first = week.find((day) => day.date.getDate() === 1);
    if (first) return MONTHS[first.date.getMonth()];
    if (index === 0) {
      const nextLabel = weeks.findIndex((other, otherIndex) => otherIndex > 0 && other.some((day) => day.date.getDate() === 1));
      if (nextLabel === -1 || nextLabel > 2) return MONTHS[week[0].date.getMonth()];
    }
    return "";
  });

  const summary = `${calendar.total} ${calendar.total === 1 ? "activity" : "activities"} on ${calendar.activeDays} ${
    calendar.activeDays === 1 ? "day" : "days"
  } over the last ${weeks.length} weeks`;

  const activeDays = weeks.flat().filter((day) => day.count > 0);

  return (
    <figure className={`[--cell:11px] sm:[--cell:13px] lg:[--cell:15px] xl:[--cell:17px] ${className}`}>
      {/* Grid disembunyikan dari pembaca layar: ringkasan ada di figcaption, detail per hari aktif di daftar sr-only di bawah. title di sel hanya tambahan untuk mouse. */}
      <div className="flex gap-2" aria-hidden="true">
        <div className="grid shrink-0 grid-rows-[14px_repeat(7,var(--cell))] gap-[3px] text-[10px] leading-[var(--cell)] text-ink-3">
          <span />
          {["Mon", "", "Wed", "", "Fri", "", ""].map((label, index) => (
            <span key={index}>{label}</span>
          ))}
        </div>
        <div className="grid auto-cols-[var(--cell)] grid-flow-col grid-rows-[14px_repeat(7,var(--cell))] gap-[3px]">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="contents">
              <span className="whitespace-nowrap text-[10px] leading-[14px] text-ink-3">{monthLabels[weekIndex]}</span>
              {week.map((day, dayIndex) => {
                const isToday = weekIndex === lastWeek && dayIndex === week.length - 1;
                // Ring cyan penanda hari ini menggantikan ring berongga; isi tetap transparan bila hari ini belum ada aktivitas.
                const tone = isToday && day.count === 0 ? "bg-transparent" : LEVELS[level(day.count)];
                return (
                  <span
                    key={dayIndex}
                    title={describe(day)}
                    className={`rounded-[3px] ${tone} ${isToday ? "ring-1 ring-cyan-ink ring-offset-1 ring-offset-sheet" : ""}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {activeDays.length > 0 ? (
        <ul className="sr-only" aria-label="Active days">
          {activeDays.map((day) => (
            <li key={day.date.getTime()}>{describe(day)}</li>
          ))}
        </ul>
      ) : null}
      <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-ink-3">
        <span>{summary}</span>
        <span className="flex items-center gap-1.5" aria-hidden="true">
          Less
          {LEVELS.map((tone) => (
            <span key={tone} className={`h-[var(--cell)] w-[var(--cell)] rounded-[3px] ${tone}`} />
          ))}
          More
        </span>
      </figcaption>
    </figure>
  );
}
