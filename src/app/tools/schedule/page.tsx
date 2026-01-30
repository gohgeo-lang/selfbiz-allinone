"use client";

import { useMemo, useRef, useState } from "react";

type AvailabilityLevel = 0 | 1 | 2;

type BlockedDate = {
  date: string;
  level: "required" | "possible";
};

type Employee = {
  id: string;
  name: string;
  hourlyWage: number;
  availability: AvailabilityLevel[];
  note: string;
  preferredShiftIds: string[];
  blockedDates: BlockedDate[];
};

type Shift = {
  id: string;
  label: string;
  start: string;
  end: string;
  headcount: number;
};

type ScheduleRow = {
  date: string;
  dateKey: string;
  weekday: string;
  assignments: string[];
};

type ScheduleSummary = {
  name: string;
  shifts: number;
  hours: number;
  cost: number;
};

type PlanType = "weekly" | "monthly";

type TemplatePreset = {
  id: string;
  label: string;
  shifts: Shift[];
};

type SlotMeta = {
  label: string;
  shiftId: string;
  shiftMinutes: number;
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

const toDateInput = (date: Date) => date.toISOString().slice(0, 10);

const parseDateInput = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const formatDate = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd}`;
};

const formatKRW = (value: number) =>
  new Intl.NumberFormat("ko-KR").format(Math.round(value));

const getWeekKey = (date: Date) => {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = (day + 6) % 7;
  copy.setDate(copy.getDate() - diff);
  return toDateInput(copy);
};

const buildDates = (start: Date, end: Date) => {
  const dates: Date[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
};

const parseTime = (value: string) => {
  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
};

const calcShiftMinutes = (shift: Shift) => {
  const start = parseTime(shift.start);
  const end = parseTime(shift.end);
  if (end === start) return 0;
  if (end > start) return end - start;
  return 24 * 60 - start + end;
};

const createEmployee = (index: number): Employee => ({
  id: `emp-${Date.now()}-${index}`,
  name: `직원 ${index + 1}`,
  hourlyWage: 10320,
  availability: [1, 1, 1, 1, 1, 1, 1],
  note: "",
  preferredShiftIds: [],
  blockedDates: [],
});

const createShift = (index: number): Shift => ({
  id: `shift-${Date.now()}-${index}`,
  label: `교대 ${index + 1}`,
  start: "09:00",
  end: "18:00",
  headcount: 1,
});

const SHIFT_TEMPLATES: TemplatePreset[] = [
  {
    id: "cafe-basic",
    label: "카페 기본 (오픈/미들/마감)",
    shifts: [
      {
        id: "open",
        label: "오픈",
        start: "07:00",
        end: "15:00",
        headcount: 1,
      },
      {
        id: "middle",
        label: "미들",
        start: "10:00",
        end: "18:00",
        headcount: 1,
      },
      {
        id: "close",
        label: "마감",
        start: "15:00",
        end: "23:00",
        headcount: 1,
      },
    ],
  },
  {
    id: "retail",
    label: "소매 기본 (주간/야간)",
    shifts: [
      {
        id: "day",
        label: "주간",
        start: "09:00",
        end: "18:00",
        headcount: 1,
      },
      {
        id: "night",
        label: "야간",
        start: "18:00",
        end: "02:00",
        headcount: 1,
      },
    ],
  },
  {
    id: "weekend",
    label: "주말 강화",
    shifts: [
      {
        id: "weekend-open",
        label: "오픈",
        start: "08:00",
        end: "14:00",
        headcount: 2,
      },
      {
        id: "weekend-close",
        label: "마감",
        start: "14:00",
        end: "22:00",
        headcount: 2,
      },
    ],
  },
];

const availabilityLabel = (level: AvailabilityLevel) => {
  if (level === 2) return "선호";
  if (level === 1) return "가능";
  return "휴무";
};

const toCSV = (rows: string[][]) => {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  return rows.map((row) => row.map((cell) => escape(cell)).join(",")).join("\n");
};

const downloadCSV = (filename: string, rows: string[][]) => {
  const blob = new Blob([toCSV(rows)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export default function ScheduleToolPage() {
  const today = new Date();
  const [planType, setPlanType] = useState<PlanType>("weekly");
  const [weekStart, setWeekStart] = useState(toDateInput(today));
  const [monthStart, setMonthStart] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`
  );
  const [maxShiftsPerWeek, setMaxShiftsPerWeek] = useState(5);
  const [maxConsecutiveDays, setMaxConsecutiveDays] = useState(5);
  const [minRestHours, setMinRestHours] = useState(11);
  const [employees, setEmployees] = useState<Employee[]>([createEmployee(0)]);
  const [shifts, setShifts] = useState<Shift[]>(SHIFT_TEMPLATES[0].shifts);
  const [selectedTemplate, setSelectedTemplate] = useState(
    SHIFT_TEMPLATES[0].id
  );
  const [blockedDateInput, setBlockedDateInput] = useState(weekStart);
  const [blockedDateType, setBlockedDateType] = useState<"required" | "possible">(
    "required"
  );
  const [shiftPrefWeight, setShiftPrefWeight] = useState(2);
  const [dayPrefWeight, setDayPrefWeight] = useState(1);
  const [possibleBlockPenalty, setPossibleBlockPenalty] = useState(3);
  const [editMode, setEditMode] = useState(false);
  const [manualAssignments, setManualAssignments] = useState<Record<string, string>>(
    {}
  );
  const [seed, setSeed] = useState(0);
  const scheduleRef = useRef<HTMLDivElement | null>(null);

  const dateRange = useMemo(() => {
    if (planType === "weekly") {
      const start = parseDateInput(weekStart);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return { start, end };
    }

    const [year, month] = monthStart.split("-").map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    return { start, end };
  }, [planType, weekStart, monthStart]);

  const slotMeta = useMemo(() => {
    const slots: SlotMeta[] = [];
    shifts.forEach((shift) => {
      const headcount = Math.max(1, shift.headcount || 1);
      for (let i = 0; i < headcount; i += 1) {
        slots.push({
          label: headcount > 1 ? `${shift.label} ${i + 1}` : shift.label,
          shiftId: shift.id,
          shiftMinutes: calcShiftMinutes(shift),
        });
      }
    });
    return slots;
  }, [shifts]);

  const schedule = useMemo(() => {
    const { start, end } = dateRange;
    if (!start || !end || start > end || slotMeta.length === 0) {
      return { rows: [] as ScheduleRow[], summary: [] as ScheduleSummary[] };
    }

    const dates = buildDates(start, end);
    const totalAssigned: Record<string, number> = {};
    const totalHours: Record<string, number> = {};
    const weeklyAssigned: Record<string, Record<string, number>> = {};
    const lastShiftEnd: Record<string, Date | null> = {};
    const lastAssignedDate: Record<string, string | null> = {};
    const consecutiveDays: Record<string, number> = {};

    employees.forEach((employee) => {
      totalAssigned[employee.id] = 0;
      totalHours[employee.id] = 0;
      weeklyAssigned[employee.id] = {};
      lastShiftEnd[employee.id] = null;
      lastAssignedDate[employee.id] = null;
      consecutiveDays[employee.id] = 0;
    });

    const rows: ScheduleRow[] = dates.map((date) => {
      const weekdayIndex = date.getDay();
      const weekKey = getWeekKey(date);
      const assignedToday = new Set<string>();
      const assignments: string[] = [];
      const dateKey = toDateInput(date);

      slotMeta.forEach((slot, slotIndex) => {
        const manualKey = `${dateKey}|${slotIndex}`;
        const manualEmployeeId = manualAssignments[manualKey];
        const manualEmployee = employees.find(
          (employee) => employee.id === manualEmployeeId
        );

        if (manualEmployee) {
          assignments.push(manualEmployee.name);
          assignedToday.add(manualEmployee.id);
          totalAssigned[manualEmployee.id] += 1;
          weeklyAssigned[manualEmployee.id][weekKey] =
            (weeklyAssigned[manualEmployee.id][weekKey] || 0) + 1;
          totalHours[manualEmployee.id] += slot.shiftMinutes / 60;

          const shiftStart = new Date(date);
          const shift = shifts.find((item) => item.id === slot.shiftId);
          if (shift) {
            const [startHour, startMinute] = shift.start.split(":").map(Number);
            shiftStart.setHours(startHour, startMinute, 0, 0);
            const shiftEnd = new Date(shiftStart);
            const [endHour, endMinute] = shift.end.split(":").map(Number);
            shiftEnd.setHours(endHour, endMinute, 0, 0);
            if (shiftEnd <= shiftStart) {
              shiftEnd.setDate(shiftEnd.getDate() + 1);
            }
            lastShiftEnd[manualEmployee.id] = shiftEnd;
          }

          lastAssignedDate[manualEmployee.id] = dateKey;
          consecutiveDays[manualEmployee.id] =
            (consecutiveDays[manualEmployee.id] || 0) + 1;
          return;
        }

        const candidates = employees
          .filter((employee) => employee.availability[weekdayIndex] > 0)
          .filter((employee) => !assignedToday.has(employee.id))
          .filter((employee) =>
            employee.blockedDates.every(
              (item) => !(item.date === dateKey && item.level === "required")
            )
          )
          .filter((employee) => {
            const weekCount = weeklyAssigned[employee.id][weekKey] || 0;
            return weekCount < maxShiftsPerWeek;
          })
          .filter((employee) => {
            const lastDate = lastAssignedDate[employee.id];
            if (!lastDate) return true;
            const last = parseDateInput(lastDate);
            const diffDays =
              (date.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
            const nextConsecutive =
              diffDays === 1 ? consecutiveDays[employee.id] + 1 : 1;
            return nextConsecutive <= maxConsecutiveDays;
          })
          .filter((employee) => {
            if (!lastShiftEnd[employee.id]) return true;
            const lastEnd = lastShiftEnd[employee.id] as Date;
            const shift = shifts.find((item) => item.id === slot.shiftId);
            if (!shift) return true;
            const shiftStart = new Date(date);
            const [startHour, startMinute] = shift.start.split(":").map(Number);
            shiftStart.setHours(startHour, startMinute, 0, 0);
            const diffMinutes =
              (shiftStart.getTime() - lastEnd.getTime()) / (1000 * 60);
            return diffMinutes >= minRestHours * 60;
          })
            .sort((a, b) => {
              const aPrefShift = a.preferredShiftIds.includes(slot.shiftId) ? 1 : 0;
              const bPrefShift = b.preferredShiftIds.includes(slot.shiftId) ? 1 : 0;
            const aPossibleBlock = a.blockedDates.some(
              (item) => item.date === dateKey && item.level === "possible"
            )
              ? 1
              : 0;
            const bPossibleBlock = b.blockedDates.some(
              (item) => item.date === dateKey && item.level === "possible"
            )
              ? 1
              : 0;

            const aScore =
              aPrefShift * shiftPrefWeight +
              a.availability[weekdayIndex] * dayPrefWeight -
              aPossibleBlock * possibleBlockPenalty;
            const bScore =
              bPrefShift * shiftPrefWeight +
              b.availability[weekdayIndex] * dayPrefWeight -
              bPossibleBlock * possibleBlockPenalty;

            if (bScore !== aScore) return bScore - aScore;

            const totalDiff = totalAssigned[a.id] - totalAssigned[b.id];
            if (totalDiff !== 0) return totalDiff;
            const weekDiff =
              (weeklyAssigned[a.id][weekKey] || 0) -
              (weeklyAssigned[b.id][weekKey] || 0);
            if (weekDiff !== 0) return weekDiff;
              const nameDiff = a.name.localeCompare(b.name, "ko");
              if (nameDiff !== 0) return nameDiff;
              const hash = (input: string) => {
                let h = 0;
                for (let i = 0; i < input.length; i += 1) {
                  h = (h << 5) - h + input.charCodeAt(i);
                  h |= 0;
                }
                return h;
              };
              const aSeed = hash(`${a.id}-${dateKey}-${slotIndex}-${seed}`);
              const bSeed = hash(`${b.id}-${dateKey}-${slotIndex}-${seed}`);
              return aSeed - bSeed;
            });

        const pick = candidates[0];
        if (!pick) {
          assignments.push("미지정");
          return;
        }

        assignedToday.add(pick.id);
        totalAssigned[pick.id] += 1;
        weeklyAssigned[pick.id][weekKey] =
          (weeklyAssigned[pick.id][weekKey] || 0) + 1;

        totalHours[pick.id] += slot.shiftMinutes / 60;

        const shift = shifts.find((item) => item.id === slot.shiftId);
        if (shift) {
          const shiftStart = new Date(date);
          const [startHour, startMinute] = shift.start.split(":").map(Number);
          shiftStart.setHours(startHour, startMinute, 0, 0);
          const shiftEnd = new Date(shiftStart);
          const [endHour, endMinute] = shift.end.split(":").map(Number);
          shiftEnd.setHours(endHour, endMinute, 0, 0);
          if (shiftEnd <= shiftStart) {
            shiftEnd.setDate(shiftEnd.getDate() + 1);
          }
          lastShiftEnd[pick.id] = shiftEnd;
        }

        const lastDate = lastAssignedDate[pick.id];
        if (lastDate) {
          const last = parseDateInput(lastDate);
          const diffDays =
            (date.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
          consecutiveDays[pick.id] = diffDays === 1 ? consecutiveDays[pick.id] + 1 : 1;
        } else {
          consecutiveDays[pick.id] = 1;
        }
        lastAssignedDate[pick.id] = dateKey;

        assignments.push(pick.name);
      });

      return {
        date: formatDate(date),
        dateKey,
        weekday: WEEKDAYS[weekdayIndex],
        assignments,
      };
    });

    const summary: ScheduleSummary[] = employees.map((employee) => ({
      name: employee.name,
      shifts: totalAssigned[employee.id] || 0,
      hours: totalHours[employee.id] || 0,
      cost: (totalHours[employee.id] || 0) * employee.hourlyWage,
    }));

    summary.sort((a, b) => b.hours - a.hours);

    return { rows, summary };
  }, [
    dateRange,
    slotMeta,
    shifts,
    employees,
    maxShiftsPerWeek,
    maxConsecutiveDays,
    minRestHours,
    manualAssignments,
    shiftPrefWeight,
    dayPrefWeight,
    possibleBlockPenalty,
    seed,
  ]);

  const updateEmployee = (id: string, patch: Partial<Employee>) => {
    setEmployees((prev) =>
      prev.map((employee) =>
        employee.id === id ? { ...employee, ...patch } : employee
      )
    );
  };

  const toggleAvailability = (id: string, dayIndex: number) => {
    setEmployees((prev) =>
      prev.map((employee) => {
        if (employee.id !== id) return employee;
        const next = [...employee.availability];
        const current = next[dayIndex];
        next[dayIndex] = ((current + 1) % 3) as AvailabilityLevel;
        return { ...employee, availability: next };
      })
    );
  };

  const addEmployee = () => {
    setEmployees((prev) => [...prev, createEmployee(prev.length)]);
  };

  const removeEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((employee) => employee.id !== id));
  };

  const updateShift = (id: string, patch: Partial<Shift>) => {
    setShifts((prev) =>
      prev.map((shift) => (shift.id === id ? { ...shift, ...patch } : shift))
    );
  };

  const addShift = () => {
    setShifts((prev) => [...prev, createShift(prev.length)]);
  };

  const removeShift = (id: string) => {
    setShifts((prev) => prev.filter((shift) => shift.id !== id));
  };

  const applyTemplate = (templateId: string) => {
    const template = SHIFT_TEMPLATES.find((item) => item.id === templateId);
    if (!template) return;
    setSelectedTemplate(templateId);
    setShifts(
      template.shifts.map((shift, idx) => ({ ...shift, id: `${shift.id}-${idx}` }))
    );
  };

  const togglePreferredShift = (employeeId: string, shiftId: string) => {
    setEmployees((prev) =>
      prev.map((employee) => {
        if (employee.id !== employeeId) return employee;
        const exists = employee.preferredShiftIds.includes(shiftId);
        const next = exists
          ? employee.preferredShiftIds.filter((id) => id !== shiftId)
          : [...employee.preferredShiftIds, shiftId];
        return { ...employee, preferredShiftIds: next };
      })
    );
  };

  const addBlockedDate = (employeeId: string) => {
    if (!blockedDateInput) return;
    setEmployees((prev) =>
      prev.map((employee) => {
        if (employee.id !== employeeId) return employee;
        if (employee.blockedDates.some((item) => item.date === blockedDateInput)) {
          return employee;
        }
        return {
          ...employee,
          blockedDates: [
            ...employee.blockedDates,
            { date: blockedDateInput, level: blockedDateType },
          ].sort((a, b) => a.date.localeCompare(b.date)),
        };
      })
    );
  };

  const removeBlockedDate = (employeeId: string, date: string) => {
    setEmployees((prev) =>
      prev.map((employee) => {
        if (employee.id !== employeeId) return employee;
        return {
          ...employee,
          blockedDates: employee.blockedDates.filter((item) => item.date !== date),
        };
      })
    );
  };

  const totalSlots = useMemo(() => {
    const perDay = shifts.reduce(
      (sum, shift) => sum + Math.max(1, shift.headcount || 1),
      0
    );
    const totalDays = schedule.rows.length;
    return perDay * totalDays;
  }, [shifts, schedule.rows.length]);

  const warnings = useMemo(() => {
    const employeeByName = new Map(employees.map((item) => [item.name, item]));
    let unassigned = 0;
    let duplicateAssignments = 0;
    let requiredBlocked = 0;
    let unavailableAssigned = 0;

    schedule.rows.forEach((row) => {
      const counts: Record<string, number> = {};
      row.assignments.forEach((name) => {
        if (name === "미지정") {
          unassigned += 1;
          return;
        }
        counts[name] = (counts[name] || 0) + 1;
        const employee = employeeByName.get(name);
        if (employee) {
          const weekdayIndex = WEEKDAYS.indexOf(row.weekday as (typeof WEEKDAYS)[number]);
          if (employee.availability[weekdayIndex] === 0) {
            unavailableAssigned += 1;
          }
          if (
            employee.blockedDates.some(
              (item) => item.date === row.dateKey && item.level === "required"
            )
          ) {
            requiredBlocked += 1;
          }
        }
      });
      duplicateAssignments += Object.values(counts).filter((count) => count > 1).length;
    });

    const completionRate =
      totalSlots > 0 ? ((totalSlots - unassigned) / totalSlots) * 100 : 0;

    return {
      unassigned,
      duplicateAssignments,
      requiredBlocked,
      unavailableAssigned,
      completionRate,
    };
  }, [employees, schedule.rows, totalSlots]);

  const getAssignmentStatus = (
    dateKey: string,
    weekdayIndex: number,
    employeeId: string
  ) => {
    const employee = employees.find((item) => item.id === employeeId);
    if (!employee) return { invalid: false, reason: "" };
    if (employee.availability[weekdayIndex] === 0) {
      return { invalid: true, reason: "휴무 요일" };
    }
    if (
      employee.blockedDates.some(
        (item) => item.date === dateKey && item.level === "required"
      )
    ) {
      return { invalid: true, reason: "필수 휴무 요청" };
    }
    return { invalid: false, reason: "" };
  };

  const downloadScheduleCSV = () => {
    const rows = [
      ["날짜", "요일", ...slotMeta.map((slot) => slot.label)],
      ...schedule.rows.map((row) => [row.date, row.weekday, ...row.assignments]),
    ];
    downloadCSV("schedule.csv", rows);
  };

  const downloadSummaryCSV = () => {
    const rows = [
      ["직원", "배정횟수", "근무시간", "예상인건비"],
      ...schedule.summary.map((item) => [
        item.name,
        `${item.shifts}`,
        item.hours.toFixed(1),
        formatKRW(item.cost),
      ]),
    ];
    downloadCSV("schedule-summary.csv", rows);
  };

  const downloadScheduleImage = async () => {
    if (!scheduleRef.current) return;
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(scheduleRef.current, {
      backgroundColor: "#ffffff",
      scale: 2,
    });
    const link = document.createElement("a");
    link.download = "schedule.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const updateManualAssignment = (
    dateKey: string,
    slotIndex: number,
    employeeId: string
  ) => {
    const key = `${dateKey}|${slotIndex}`;
    if (employeeId) {
      const duplicates = Object.entries(manualAssignments).some(
        ([otherKey, otherEmployee]) =>
          otherKey.startsWith(`${dateKey}|`) &&
          otherKey !== key &&
          otherEmployee === employeeId
      );
      if (duplicates) {
        const ok = window.confirm(
          "같은 날짜에 동일 직원이 중복 배정됩니다. 계속할까요?"
        );
        if (!ok) return;
      }
      const weekdayIndex = WEEKDAYS.indexOf(
        schedule.rows.find((row) => row.dateKey === dateKey)?.weekday as
          | (typeof WEEKDAYS)[number]
          | undefined
      );
      if (weekdayIndex >= 0) {
        const status = getAssignmentStatus(dateKey, weekdayIndex, employeeId);
        if (status.invalid) {
          const ok = window.confirm(
            `규칙 위반(${status.reason})입니다. 그래도 배정할까요?`
          );
          if (!ok) return;
        }
      }
    }
    setManualAssignments((prev) => ({
      ...prev,
      [key]: employeeId,
    }));
  };

  return (
    <div className="flex flex-col gap-10">
      <section className="rounded-[28px] border border-black/5 bg-white/80 p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/40">
          Schedule Builder
        </p>
        <h1 className="font-display mt-4 text-4xl">근무표생성기</h1>
        <p className="mt-4 max-w-2xl text-[var(--muted)]">
          주간/월간 템플릿과 직원 선호 요일을 반영해 근무표를 생성합니다.
          연속근무 제한, 최소 휴식시간, 주당 최대 근무 횟수를 지원합니다.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="card-shadow rounded-3xl border border-black/5 bg-white/80 p-6">
          <h2 className="font-display text-xl">기간/규칙</h2>
          <div className="mt-6 grid gap-4">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setPlanType("weekly")}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  planType === "weekly"
                    ? "bg-black text-white"
                    : "border border-black/10 text-black/60"
                }`}
              >
                주간 템플릿
              </button>
              <button
                type="button"
                onClick={() => setPlanType("monthly")}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  planType === "monthly"
                    ? "bg-black text-white"
                    : "border border-black/10 text-black/60"
                }`}
              >
                월간 템플릿
              </button>
            </div>

            {planType === "weekly" ? (
              <label className="flex flex-col gap-2 text-sm font-semibold text-black/70">
                주 시작일
                <input
                  type="date"
                  value={weekStart}
                  onChange={(e) => setWeekStart(e.target.value)}
                  className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-base"
                />
              </label>
            ) : (
              <label className="flex flex-col gap-2 text-sm font-semibold text-black/70">
                월 선택
                <input
                  type="month"
                  value={monthStart}
                  onChange={(e) => setMonthStart(e.target.value)}
                  className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-base"
                />
              </label>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-semibold text-black/70">
                주당 최대 근무 횟수
                <input
                  type="number"
                  min={1}
                  max={7}
                  value={maxShiftsPerWeek}
                  onChange={(e) => setMaxShiftsPerWeek(Number(e.target.value))}
                  className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-base"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-black/70">
                최대 연속 근무일
                <input
                  type="number"
                  min={1}
                  max={7}
                  value={maxConsecutiveDays}
                  onChange={(e) => setMaxConsecutiveDays(Number(e.target.value))}
                  className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-base"
                />
              </label>
            </div>

            <label className="flex flex-col gap-2 text-sm font-semibold text-black/70">
              최소 휴식시간 (시간)
              <input
                type="number"
                min={0}
                step={1}
                value={minRestHours}
                onChange={(e) => setMinRestHours(Number(e.target.value))}
                className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-base"
              />
            </label>

            <div className="rounded-2xl border border-black/10 bg-white/70 p-4 text-xs text-black/60">
              <p className="font-semibold text-black/70">선호 가중치</p>
              <div className="mt-3 grid gap-3">
                <label className="flex items-center justify-between gap-3">
                  교대 선호 가중치
                  <input
                    type="range"
                    min={0}
                    max={5}
                    value={shiftPrefWeight}
                    onChange={(e) => setShiftPrefWeight(Number(e.target.value))}
                  />
                  <span className="w-6 text-right">{shiftPrefWeight}</span>
                </label>
                <label className="flex items-center justify-between gap-3">
                  요일 선호 가중치
                  <input
                    type="range"
                    min={0}
                    max={5}
                    value={dayPrefWeight}
                    onChange={(e) => setDayPrefWeight(Number(e.target.value))}
                  />
                  <span className="w-6 text-right">{dayPrefWeight}</span>
                </label>
                <label className="flex items-center justify-between gap-3">
                  휴무 요청(가능) 패널티
                  <input
                    type="range"
                    min={0}
                    max={5}
                    value={possibleBlockPenalty}
                    onChange={(e) => setPossibleBlockPenalty(Number(e.target.value))}
                  />
                  <span className="w-6 text-right">{possibleBlockPenalty}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="card-shadow rounded-3xl border border-black/5 bg-white/80 p-6">
          <h2 className="font-display text-xl">교대 템플릿</h2>
          <div className="mt-6 grid gap-3">
            <select
              className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-base"
              value={selectedTemplate}
              onChange={(e) => applyTemplate(e.target.value)}
            >
              {SHIFT_TEMPLATES.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.label}
                </option>
              ))}
            </select>

            {shifts.map((shift) => (
              <div
                key={shift.id}
                className="rounded-2xl border border-black/10 bg-white/80 p-4"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    className="flex-1 rounded-xl border border-black/10 px-3 py-2 text-sm font-semibold"
                    value={shift.label}
                    onChange={(e) => updateShift(shift.id, { label: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => removeShift(shift.id)}
                    className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-black/60"
                    disabled={shifts.length === 1}
                  >
                    삭제
                  </button>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <label className="flex flex-col gap-2 text-xs font-semibold text-black/60">
                    시작
                    <input
                      type="time"
                      value={shift.start}
                      onChange={(e) => updateShift(shift.id, { start: e.target.value })}
                      className="rounded-xl border border-black/10 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-xs font-semibold text-black/60">
                    종료
                    <input
                      type="time"
                      value={shift.end}
                      onChange={(e) => updateShift(shift.id, { end: e.target.value })}
                      className="rounded-xl border border-black/10 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-xs font-semibold text-black/60">
                    인원
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={shift.headcount}
                      onChange={(e) =>
                        updateShift(shift.id, { headcount: Number(e.target.value) })
                      }
                      className="rounded-xl border border-black/10 px-3 py-2 text-sm"
                    />
                  </label>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addShift}
              className="rounded-full border border-black/10 bg-white/80 px-5 py-2 text-sm font-semibold text-black/60"
            >
              교대 추가
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="card-shadow rounded-3xl border border-black/5 bg-white/80 p-6">
          <h2 className="font-display text-xl">직원</h2>
          <div className="mt-6 flex flex-col gap-4">
            {employees.map((employee) => (
              <div
                key={employee.id}
                className="rounded-2xl border border-black/10 bg-white/80 p-4"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    className="flex-1 rounded-xl border border-black/10 px-3 py-2 text-sm font-semibold"
                    value={employee.name}
                    onChange={(e) => updateEmployee(employee.id, { name: e.target.value })}
                  />
                  <input
                    type="number"
                    min={0}
                    value={employee.hourlyWage}
                    onChange={(e) =>
                      updateEmployee(employee.id, { hourlyWage: Number(e.target.value) })
                    }
                    className="w-28 rounded-xl border border-black/10 px-3 py-2 text-sm"
                    placeholder="시급"
                  />
                  <button
                    type="button"
                    onClick={() => removeEmployee(employee.id)}
                    className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-black/60"
                    disabled={employees.length === 1}
                  >
                    삭제
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-7 gap-2 text-xs text-black/60">
                  {WEEKDAYS.map((day, idx) => {
                    const level = employee.availability[idx];
                    const style =
                      level === 2
                        ? "bg-black text-white"
                        : level === 1
                        ? "bg-white text-black/70"
                        : "bg-black/10 text-black/30";
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleAvailability(employee.id, idx)}
                        className={`rounded-full border border-black/10 px-2 py-1 text-center font-semibold transition ${style}`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2 text-[11px] text-black/40">
                  요일 버튼: 가능 → 선호 → 휴무 ({availabilityLabel(1)} 기준)
                </div>

                <div className="mt-4">
                  <p className="text-xs font-semibold text-black/60">선호 교대</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {shifts.map((shift) => {
                      const active = employee.preferredShiftIds.includes(shift.id);
                      return (
                        <button
                          key={shift.id}
                          type="button"
                          onClick={() => togglePreferredShift(employee.id, shift.id)}
                          className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                            active
                              ? "border-black bg-black text-white"
                              : "border-black/10 text-black/60"
                          }`}
                        >
                          {shift.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-semibold text-black/60">휴무 요청</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <input
                      type="date"
                      value={blockedDateInput}
                      onChange={(e) => setBlockedDateInput(e.target.value)}
                      className="rounded-xl border border-black/10 px-3 py-2 text-xs"
                    />
                    <select
                      value={blockedDateType}
                      onChange={(e) =>
                        setBlockedDateType(e.target.value as "required" | "possible")
                      }
                      className="rounded-xl border border-black/10 px-3 py-2 text-xs"
                    >
                      <option value="required">필수 휴무</option>
                      <option value="possible">가능 휴무</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => addBlockedDate(employee.id)}
                      className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-black/60"
                    >
                      추가
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {employee.blockedDates.length === 0 ? (
                      <span className="text-[11px] text-black/40">등록된 휴무 없음</span>
                    ) : (
                      employee.blockedDates.map((item) => (
                        <button
                          key={`${item.date}-${item.level}`}
                          type="button"
                          onClick={() => removeBlockedDate(employee.id, item.date)}
                          className={`rounded-full border px-2 py-1 text-[11px] ${
                            item.level === "required"
                              ? "border-black/20 bg-black/5 text-black/70"
                              : "border-black/10 text-black/60"
                          }`}
                          title="클릭하면 삭제"
                        >
                          {item.date} · {item.level === "required" ? "필수" : "가능"}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <textarea
                  value={employee.note}
                  onChange={(e) => updateEmployee(employee.id, { note: e.target.value })}
                  placeholder="선호/휴무 요청 메모"
                  className="mt-3 w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-xs"
                  rows={2}
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addEmployee}
            className="mt-4 rounded-full border border-black/10 bg-white/80 px-5 py-2 text-sm font-semibold text-black/60"
          >
            직원 추가
          </button>
        </div>

        <div className="card-shadow rounded-3xl border border-black/5 bg-white/80 p-6">
          <h2 className="font-display text-xl">요약</h2>
          <div className="mt-6 grid gap-4 text-sm text-black/70">
            <div className="flex items-center justify-between">
              <span>총 배치 슬롯</span>
              <span className="font-semibold text-black">{totalSlots}칸</span>
            </div>
            <div className="flex items-center justify-between">
              <span>직원 수</span>
              <span className="font-semibold text-black">{employees.length}명</span>
            </div>
            <div className="flex items-center justify-between">
              <span>배정 완료율</span>
              <span className="font-semibold text-black">
                {warnings.completionRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>미배정 슬롯</span>
              <span className="font-semibold text-black">
                {warnings.unassigned}칸
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>예상 인건비 합계</span>
              <span className="font-semibold text-black">
                {formatKRW(
                  schedule.summary.reduce((sum, item) => sum + item.cost, 0)
                )}
                원
              </span>
            </div>
          </div>
          <div className="mt-6 grid gap-3 rounded-2xl border border-black/10 bg-white/70 p-4 text-xs text-black/60">
            <p className="font-semibold text-black/70">배치/인건비 요약</p>
            <div className="flex flex-wrap gap-3">
              {schedule.summary.map((item) => (
                <span
                  key={item.name}
                  className="rounded-full border border-black/10 px-3 py-1"
                >
                  {item.name} · {item.shifts}회 · {item.hours.toFixed(1)}h · {formatKRW(item.cost)}원
                </span>
              ))}
            </div>
            <p className="text-[11px] text-black/40">
              인건비는 시급 기준 단순 합산입니다. 정교한 산정은 인건비 계산기와 연동하세요.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={downloadScheduleCSV}
                className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-black/60"
              >
                근무표 CSV
              </button>
              <button
                type="button"
                onClick={downloadSummaryCSV}
                className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-black/60"
              >
                요약 CSV
              </button>
              <button
                type="button"
                onClick={downloadScheduleImage}
                className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-black/60"
              >
                PNG 저장
              </button>
              <button
                type="button"
                onClick={() => {
                  if (Object.keys(manualAssignments).length === 0) return;
                  const ok = window.confirm(
                    "수동 배정을 모두 초기화하고 자동 배치로 되돌릴까요?"
                  );
                  if (!ok) return;
                  setManualAssignments({});
                }}
                className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-black/60"
              >
                수동 배정 초기화
              </button>
              <a
                href="/tools/labor"
                className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-black/60"
              >
                인건비 계산기
              </a>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-black/50">
              <span className="rounded-full border border-black/10 px-3 py-1">
                중복 배정 {warnings.duplicateAssignments}건
              </span>
              <span className="rounded-full border border-black/10 px-3 py-1">
                휴무 요일 배정 {warnings.unavailableAssigned}건
              </span>
              <span className="rounded-full border border-black/10 px-3 py-1">
                필수 휴무 배정 {warnings.requiredBlocked}건
              </span>
            </div>
          </div>
        </div>
      </section>

      <section
        ref={scheduleRef}
        className="card-shadow rounded-3xl border border-black/5 bg-white/80 p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/40">
              Schedule
            </p>
            <h2 className="font-display mt-2 text-2xl">생성된 근무표</h2>
          </div>
          <div className="flex items-center gap-3 text-xs text-black/50">
            <button
              type="button"
              onClick={() => setSeed(Date.now())}
              className="rounded-full border border-black/10 px-3 py-1 font-semibold"
            >
              재생성
            </button>
            <button
              type="button"
              onClick={() => setEditMode((prev) => !prev)}
              className={`rounded-full px-3 py-1 font-semibold transition ${
                editMode ? "bg-black text-white" : "border border-black/10"
              }`}
            >
              {editMode ? "편집 모드" : "읽기 모드"}
            </button>
            선호 교대 + 선호 요일 + 공정 분배 + 휴식시간 반영
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 text-black/50">
                <th className="px-3 py-2">날짜</th>
                <th className="px-3 py-2">요일</th>
                {slotMeta.map((slot, idx) => (
                  <th key={`${slot.shiftId}-${idx}`} className="px-3 py-2">
                    {slot.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {schedule.rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={2 + slotMeta.length}
                    className="px-3 py-6 text-center text-black/40"
                  >
                    기간과 교대 설정을 입력하면 근무표가 생성됩니다.
                  </td>
                </tr>
              ) : (
                schedule.rows.map((row) => (
                  <tr key={`${row.dateKey}-${row.weekday}`} className="border-b border-black/5">
                    <td className="px-3 py-2 font-semibold text-black/70">
                      {row.date}
                    </td>
                    <td className="px-3 py-2 text-black/50">{row.weekday}</td>
                    {row.assignments.map((value, idx) => (
                      <td key={`${row.dateKey}-${idx}`} className="px-3 py-2">
                        {editMode ? (() => {
                          const key = `${row.dateKey}|${idx}`;
                          const selectedId = manualAssignments[key] || "";
                          const weekdayIndex = WEEKDAYS.indexOf(
                            row.weekday as (typeof WEEKDAYS)[number]
                          );
                          const status = selectedId
                            ? getAssignmentStatus(row.dateKey, weekdayIndex, selectedId)
                            : { invalid: false, reason: "" };
                          return (
                            <select
                              className={`rounded-full border px-2 py-1 text-xs ${
                                status.invalid ? "border-red-400 text-red-600" : "border-black/10"
                              }`}
                              value={selectedId}
                              onChange={(e) =>
                                updateManualAssignment(
                                  row.dateKey,
                                  idx,
                                  e.target.value
                                )
                              }
                              title={status.invalid ? status.reason : ""}
                            >
                              <option value="">미지정</option>
                              {employees.map((employee) => (
                                <option key={employee.id} value={employee.id}>
                                  {employee.name}
                                </option>
                              ))}
                            </select>
                          );
                        })() : (
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              value === "미지정"
                                ? "bg-black/5 text-black/40"
                                : "bg-white text-black/70"
                            }`}
                          >
                            {value}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 grid gap-3 rounded-2xl border border-black/10 bg-white/70 p-4 text-xs text-black/60">
          <p className="font-semibold text-black/70">배치 요약</p>
          <div className="flex flex-wrap gap-3">
            {schedule.summary.map((item) => (
              <span
                key={item.name}
                className="rounded-full border border-black/10 px-3 py-1"
              >
                {item.name} · {item.shifts}회
              </span>
            ))}
          </div>
          <p className="text-[11px] text-black/40">
            편집 모드에서 직접 배정할 수 있습니다. 수동 배정은 자동 규칙보다 우선됩니다.
          </p>
        </div>
      </section>
    </div>
  );
}
