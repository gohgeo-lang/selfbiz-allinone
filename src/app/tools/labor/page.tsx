"use client";

import { useMemo, useState } from "react";

type PayType = "hourly" | "monthly";

type Employee = {
  id: string;
  name: string;
  payType: PayType;
  hourlyWage: number;
  monthlySalary: number;
  dailyHours: number;
  breakMinutes: number;
  daysPerWeek: number;
  weeksPerMonth: number;
  nightHoursPerWeek: number;
  holidayHoursPerWeek: number;
  includeWeeklyAllowance: boolean;
  includeOvertime: boolean;
};

type InsuranceRates = {
  nationalPensionEmployee: number;
  nationalPensionEmployer: number;
  healthInsuranceEmployee: number;
  healthInsuranceEmployer: number;
  longTermCareRate: number;
  employmentUnemploymentEmployee: number;
  employmentUnemploymentEmployer: number;
  employmentJobTrainingEmployer: number;
  industrialAccidentEmployer: number;
};

const formatKRW = (value: number) =>
  new Intl.NumberFormat("ko-KR").format(Math.round(value));

const createEmployee = (index: number): Employee => ({
  id: `emp-${Date.now()}-${index}`,
  name: `직원 ${index + 1}`,
  payType: "hourly",
  hourlyWage: 11000,
  monthlySalary: 2200000,
  dailyHours: 8,
  breakMinutes: 60,
  daysPerWeek: 5,
  weeksPerMonth: 4.345,
  nightHoursPerWeek: 0,
  holidayHoursPerWeek: 0,
  includeWeeklyAllowance: true,
  includeOvertime: true,
});

const sanitizeEmployee = (employee: Employee) => {
  const safeDaily = Math.max(0, employee.dailyHours);
  const safeBreak = Math.max(0, Math.min(employee.breakMinutes, safeDaily * 60));
  const safeDays = Math.max(0, Math.min(employee.daysPerWeek, 7));
  const safeWeeks = Math.max(0, employee.weeksPerMonth);
  const effectiveDailyHours = Math.max(0, safeDaily - safeBreak / 60);
  const weeklyHours = effectiveDailyHours * safeDays;
  const monthlyHours = weeklyHours * safeWeeks;

  return {
    effectiveDailyHours,
    weeklyHours,
    monthlyHours,
    safeDays,
    safeWeeks,
  };
};

const calcEmployee = (
  employee: Employee,
  insurance: InsuranceRates,
  includeInsurance: boolean
) => {
  const { effectiveDailyHours, weeklyHours, monthlyHours, safeDays, safeWeeks } =
    sanitizeEmployee(employee);

  const hourly =
    employee.payType === "hourly"
      ? Math.max(0, employee.hourlyWage)
      : monthlyHours > 0
      ? Math.max(0, employee.monthlySalary) / monthlyHours
      : 0;

  const basePay =
    employee.payType === "hourly"
      ? hourly * monthlyHours
      : Math.max(0, employee.monthlySalary);

  const weeklyAllowanceHours =
    employee.includeWeeklyAllowance && weeklyHours >= 15 && safeDays > 0
      ? Math.min(8, weeklyHours / safeDays)
      : 0;
  const weeklyAllowancePay = hourly * weeklyAllowanceHours * safeWeeks;

  const dailyOvertimeHoursWeek =
    effectiveDailyHours > 8 ? (effectiveDailyHours - 8) * safeDays : 0;
  const weeklyOvertimeHoursWeek = Math.max(0, weeklyHours - 40);
  const overtimeHoursWeek = Math.max(
    dailyOvertimeHoursWeek,
    weeklyOvertimeHoursWeek
  );
  const overtimePremium = employee.includeOvertime
    ? hourly * 0.5 * overtimeHoursWeek * safeWeeks
    : 0;

  const nightPremium =
    Math.max(0, employee.nightHoursPerWeek) * hourly * 0.5 * safeWeeks;
  const holidayPremium =
    Math.max(0, employee.holidayHoursPerWeek) * hourly * 0.5 * safeWeeks;

  const grossPay =
    basePay + weeklyAllowancePay + overtimePremium + nightPremium + holidayPremium;

  const npEmployee = grossPay * (insurance.nationalPensionEmployee / 100);
  const npEmployer = grossPay * (insurance.nationalPensionEmployer / 100);

  const hiEmployee = grossPay * (insurance.healthInsuranceEmployee / 100);
  const hiEmployer = grossPay * (insurance.healthInsuranceEmployer / 100);
  const ltcEmployee = hiEmployee * (insurance.longTermCareRate / 100);
  const ltcEmployer = hiEmployer * (insurance.longTermCareRate / 100);

  const eiEmployee = grossPay * (insurance.employmentUnemploymentEmployee / 100);
  const eiEmployerBase =
    grossPay * (insurance.employmentUnemploymentEmployer / 100);
  const eiEmployerJobTraining =
    grossPay * (insurance.employmentJobTrainingEmployer / 100);

  const iaEmployer =
    grossPay * (insurance.industrialAccidentEmployer / 100);

  const employeeInsuranceTotal = includeInsurance
    ? npEmployee + hiEmployee + ltcEmployee + eiEmployee
    : 0;
  const employerInsuranceTotal = includeInsurance
    ? npEmployer + hiEmployer + ltcEmployer + eiEmployerBase + eiEmployerJobTraining + iaEmployer
    : 0;

  const employeeNetPay = grossPay - employeeInsuranceTotal;
  const employerTotalCost = grossPay + employerInsuranceTotal;

  return {
    hourly,
    effectiveDailyHours,
    weeklyHours,
    monthlyHours,
    basePay,
    weeklyAllowancePay,
    overtimePremium,
    nightPremium,
    holidayPremium,
    grossPay,
    employeeInsuranceTotal,
    employerInsuranceTotal,
    employeeNetPay,
    employerTotalCost,
  };
};

export default function LaborToolPage() {
  const [employees, setEmployees] = useState<Employee[]>([createEmployee(0)]);
  const [includeInsurance, setIncludeInsurance] = useState(true);
  const [insuranceRates, setInsuranceRates] = useState<InsuranceRates>({
    nationalPensionEmployee: 4.5,
    nationalPensionEmployer: 4.5,
    healthInsuranceEmployee: 3.545,
    healthInsuranceEmployer: 3.545,
    longTermCareRate: 12.95,
    employmentUnemploymentEmployee: 0.9,
    employmentUnemploymentEmployer: 0.9,
    employmentJobTrainingEmployer: 0.25,
    industrialAccidentEmployer: 1.47,
  });

  const totals = useMemo(() => {
    const rows = employees.map((employee) =>
      calcEmployee(employee, insuranceRates, includeInsurance)
    );
    const sum = rows.reduce(
      (acc, row) => {
        acc.grossPay += row.grossPay;
        acc.basePay += row.basePay;
        acc.weeklyAllowancePay += row.weeklyAllowancePay;
        acc.overtimePremium += row.overtimePremium;
        acc.nightPremium += row.nightPremium;
        acc.holidayPremium += row.holidayPremium;
        acc.employeeInsuranceTotal += row.employeeInsuranceTotal;
        acc.employerInsuranceTotal += row.employerInsuranceTotal;
        acc.employeeNetPay += row.employeeNetPay;
        acc.employerTotalCost += row.employerTotalCost;
        return acc;
      },
      {
        grossPay: 0,
        basePay: 0,
        weeklyAllowancePay: 0,
        overtimePremium: 0,
        nightPremium: 0,
        holidayPremium: 0,
        employeeInsuranceTotal: 0,
        employerInsuranceTotal: 0,
        employeeNetPay: 0,
        employerTotalCost: 0,
      }
    );

    return { rows, sum };
  }, [employees, insuranceRates, includeInsurance]);

  const updateEmployee = (id: string, patch: Partial<Employee>) => {
    setEmployees((prev) =>
      prev.map((employee) =>
        employee.id === id ? { ...employee, ...patch } : employee
      )
    );
  };

  const addEmployee = () => {
    setEmployees((prev) => [...prev, createEmployee(prev.length)]);
  };

  const removeEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((employee) => employee.id !== id));
  };

  return (
    <div className="flex flex-col gap-10">
      <section className="rounded-[28px] border border-black/5 bg-white/80 p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/40">
          Labor Cost
        </p>
        <h1 className="font-display mt-4 text-4xl">인건비계산기</h1>
        <p className="mt-4 max-w-2xl text-[var(--muted)]">
          직원별 급여 형태와 근무 시간을 입력하면 월 인건비를 계산합니다.
          주휴·연장·야간·휴일수당과 4대보험(사업주/근로자 부담)을 분리해 보여줍니다.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
        <div className="flex flex-col gap-6">
          {employees.map((employee, index) => {
            const row = totals.rows[index];
            return (
              <div
                key={employee.id}
                className="card-shadow rounded-3xl border border-black/5 bg-white/80 p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/40">
                      직원 {index + 1}
                    </p>
                    <input
                      className="rounded-2xl border border-black/10 bg-white px-4 py-2 text-base font-semibold text-black"
                      value={employee.name}
                      onChange={(e) =>
                        updateEmployee(employee.id, { name: e.target.value })
                      }
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeEmployee(employee.id)}
                    className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold text-black/70 transition hover:bg-black/5"
                    disabled={employees.length === 1}
                  >
                    삭제
                  </button>
                </div>

                <div className="mt-6 grid gap-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="flex flex-col gap-2 text-sm font-semibold text-black/70">
                      급여 형태
                      <select
                        className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-base"
                        value={employee.payType}
                        onChange={(e) =>
                          updateEmployee(employee.id, {
                            payType: e.target.value as PayType,
                          })
                        }
                      >
                        <option value="hourly">시급</option>
                        <option value="monthly">월급</option>
                      </select>
                    </label>
                    {employee.payType === "hourly" ? (
                      <label className="flex flex-col gap-2 text-sm font-semibold text-black/70">
                        시급 (원)
                        <input
                          type="number"
                          min={0}
                          value={employee.hourlyWage}
                          onChange={(e) =>
                            updateEmployee(employee.id, {
                              hourlyWage: Number(e.target.value),
                            })
                          }
                          className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-base"
                        />
                        <span className="text-xs font-medium text-black/50">
                          2026 최저시급 10,320원 · 월 환산 2,156,880원(209시간)
                        </span>
                      </label>
                    ) : (
                      <label className="flex flex-col gap-2 text-sm font-semibold text-black/70">
                        월급 (원)
                        <input
                          type="number"
                          min={0}
                          value={employee.monthlySalary}
                          onChange={(e) =>
                            updateEmployee(employee.id, {
                              monthlySalary: Number(e.target.value),
                            })
                          }
                          className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-base"
                        />
                      </label>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="flex flex-col gap-2 text-sm font-semibold text-black/70">
                      일 근무시간 (시간)
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={employee.dailyHours}
                        onChange={(e) =>
                          updateEmployee(employee.id, {
                            dailyHours: Number(e.target.value),
                          })
                        }
                        className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-base"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm font-semibold text-black/70">
                      휴게시간 (분)
                      <input
                        type="number"
                        min={0}
                        step={10}
                        value={employee.breakMinutes}
                        onChange={(e) =>
                          updateEmployee(employee.id, {
                            breakMinutes: Number(e.target.value),
                          })
                        }
                        className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-base"
                      />
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="flex flex-col gap-2 text-sm font-semibold text-black/70">
                      주 근무일 수
                      <input
                        type="number"
                        min={0}
                        max={7}
                        value={employee.daysPerWeek}
                        onChange={(e) =>
                          updateEmployee(employee.id, {
                            daysPerWeek: Number(e.target.value),
                          })
                        }
                        className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-base"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm font-semibold text-black/70">
                      월 환산 주 수
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={employee.weeksPerMonth}
                        onChange={(e) =>
                          updateEmployee(employee.id, {
                            weeksPerMonth: Number(e.target.value),
                          })
                        }
                        className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-base"
                      />
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="flex flex-col gap-2 text-sm font-semibold text-black/70">
                      야간 근무시간/주 (22~06)
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={employee.nightHoursPerWeek}
                        onChange={(e) =>
                          updateEmployee(employee.id, {
                            nightHoursPerWeek: Number(e.target.value),
                          })
                        }
                        className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-base"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm font-semibold text-black/70">
                      휴일 근무시간/주
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={employee.holidayHoursPerWeek}
                        onChange={(e) =>
                          updateEmployee(employee.id, {
                            holidayHoursPerWeek: Number(e.target.value),
                          })
                        }
                        className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-base"
                      />
                    </label>
                  </div>

                  <div className="flex flex-col gap-3 text-sm text-black/70">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={employee.includeWeeklyAllowance}
                        onChange={(e) =>
                          updateEmployee(employee.id, {
                            includeWeeklyAllowance: e.target.checked,
                          })
                        }
                        className="h-4 w-4 rounded border-black/20"
                      />
                      주휴수당 포함 (주 15시간 이상 기준)
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={employee.includeOvertime}
                        onChange={(e) =>
                          updateEmployee(employee.id, {
                            includeOvertime: e.target.checked,
                          })
                        }
                        className="h-4 w-4 rounded border-black/20"
                      />
                      연장수당 포함 (8시간/40시간 초과분 50% 가산)
                    </label>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-black/10 bg-white/80 p-4 text-sm text-black/70">
                  <div className="flex items-center justify-between">
                    <span>실지급(근로자)</span>
                    <span className="font-semibold text-black">
                      {formatKRW(row?.employeeNetPay ?? 0)}원
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span>사업주 총부담</span>
                    <span className="font-semibold text-black">
                      {formatKRW(row?.employerTotalCost ?? 0)}원
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-black/50">
                    급여 {formatKRW(row?.grossPay ?? 0)}원 · 근로자 4대보험
                    {formatKRW(row?.employeeInsuranceTotal ?? 0)}원 · 사업주 4대보험
                    {formatKRW(row?.employerInsuranceTotal ?? 0)}원
                  </p>
                </div>
              </div>
            );
          })}

          <button
            type="button"
            onClick={addEmployee}
            className="rounded-full border border-black/10 bg-white/80 px-6 py-3 text-sm font-semibold text-black/70 transition hover:bg-black/5"
          >
            직원 추가
          </button>
        </div>

        <div className="card-shadow rounded-3xl border border-black/5 bg-white/80 p-6">
          <h2 className="font-display text-xl">요약</h2>
          <div className="mt-6 grid gap-4 text-sm text-black/70">
            <div className="flex items-center justify-between">
              <span>직원 수</span>
              <span className="font-semibold text-black">
                {employees.length}명
              </span>
            </div>
            <div className="h-px bg-black/10" />
            <div className="flex items-center justify-between">
              <span>급여 합계</span>
              <span className="font-semibold text-black">
                {formatKRW(totals.sum.grossPay)}원
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>근로자 4대보험 합계</span>
              <span className="font-semibold text-black">
                {formatKRW(totals.sum.employeeInsuranceTotal)}원
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>사업주 4대보험 합계</span>
              <span className="font-semibold text-black">
                {formatKRW(totals.sum.employerInsuranceTotal)}원
              </span>
            </div>
            <div className="h-px bg-black/10" />
            <div className="flex items-center justify-between text-base">
              <span className="font-semibold text-black">실지급 총액</span>
              <span className="font-semibold text-black">
                {formatKRW(totals.sum.employeeNetPay)}원
              </span>
            </div>
            <div className="flex items-center justify-between text-base">
              <span className="font-semibold text-black">사업주 총부담</span>
              <span className="font-semibold text-black">
                {formatKRW(totals.sum.employerTotalCost)}원
              </span>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-black/10 bg-white/80 p-4 text-sm text-black/70">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-black">4대보험 적용</span>
              <label className="flex items-center gap-2 text-xs font-semibold text-black/60">
                <input
                  type="checkbox"
                  checked={includeInsurance}
                  onChange={(e) => setIncludeInsurance(e.target.checked)}
                  className="h-4 w-4 rounded border-black/20"
                />
                적용
              </label>
            </div>

            <div className="mt-4 grid gap-3">
              <div className="grid gap-2 text-xs">
                <p className="font-semibold text-black/70">국민연금 (%)</p>
                <div className="flex items-center justify-between gap-3">
                  근로자
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={insuranceRates.nationalPensionEmployee}
                    onChange={(e) =>
                      setInsuranceRates((prev) => ({
                        ...prev,
                        nationalPensionEmployee: Number(e.target.value),
                      }))
                    }
                    className="w-24 rounded-full border border-black/10 bg-white px-3 py-1 text-right"
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  사업주
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={insuranceRates.nationalPensionEmployer}
                    onChange={(e) =>
                      setInsuranceRates((prev) => ({
                        ...prev,
                        nationalPensionEmployer: Number(e.target.value),
                      }))
                    }
                    className="w-24 rounded-full border border-black/10 bg-white px-3 py-1 text-right"
                  />
                </div>
              </div>

              <div className="grid gap-2 text-xs">
                <p className="font-semibold text-black/70">건강보험 (%)</p>
                <div className="flex items-center justify-between gap-3">
                  근로자
                  <input
                    type="number"
                    min={0}
                    step={0.001}
                    value={insuranceRates.healthInsuranceEmployee}
                    onChange={(e) =>
                      setInsuranceRates((prev) => ({
                        ...prev,
                        healthInsuranceEmployee: Number(e.target.value),
                      }))
                    }
                    className="w-24 rounded-full border border-black/10 bg-white px-3 py-1 text-right"
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  사업주
                  <input
                    type="number"
                    min={0}
                    step={0.001}
                    value={insuranceRates.healthInsuranceEmployer}
                    onChange={(e) =>
                      setInsuranceRates((prev) => ({
                        ...prev,
                        healthInsuranceEmployer: Number(e.target.value),
                      }))
                    }
                    className="w-24 rounded-full border border-black/10 bg-white px-3 py-1 text-right"
                  />
                </div>
              </div>

              <label className="flex items-center justify-between gap-3 text-xs">
                장기요양보험료율 (건보료 대비 %)
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={insuranceRates.longTermCareRate}
                  onChange={(e) =>
                    setInsuranceRates((prev) => ({
                      ...prev,
                      longTermCareRate: Number(e.target.value),
                    }))
                  }
                  className="w-24 rounded-full border border-black/10 bg-white px-3 py-1 text-right"
                />
              </label>

              <div className="grid gap-2 text-xs">
                <p className="font-semibold text-black/70">고용보험: 실업급여 (%)</p>
                <div className="flex items-center justify-between gap-3">
                  근로자
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={insuranceRates.employmentUnemploymentEmployee}
                    onChange={(e) =>
                      setInsuranceRates((prev) => ({
                        ...prev,
                        employmentUnemploymentEmployee: Number(e.target.value),
                      }))
                    }
                    className="w-24 rounded-full border border-black/10 bg-white px-3 py-1 text-right"
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  사업주
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={insuranceRates.employmentUnemploymentEmployer}
                    onChange={(e) =>
                      setInsuranceRates((prev) => ({
                        ...prev,
                        employmentUnemploymentEmployer: Number(e.target.value),
                      }))
                    }
                    className="w-24 rounded-full border border-black/10 bg-white px-3 py-1 text-right"
                  />
                </div>
              </div>

              <label className="flex items-center justify-between gap-3 text-xs">
                고용보험: 고용안정·직능개발 (사업주 %)
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={insuranceRates.employmentJobTrainingEmployer}
                  onChange={(e) =>
                    setInsuranceRates((prev) => ({
                      ...prev,
                      employmentJobTrainingEmployer: Number(e.target.value),
                    }))
                  }
                  className="w-24 rounded-full border border-black/10 bg-white px-3 py-1 text-right"
                />
              </label>

              <label className="flex items-center justify-between gap-3 text-xs">
                산재보험 (사업주 %)
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={insuranceRates.industrialAccidentEmployer}
                  onChange={(e) =>
                    setInsuranceRates((prev) => ({
                      ...prev,
                      industrialAccidentEmployer: Number(e.target.value),
                    }))
                  }
                  className="w-24 rounded-full border border-black/10 bg-white px-3 py-1 text-right"
                />
              </label>
            </div>
          </div>

          <p className="mt-4 text-xs text-black/50">
            월급제는 월급을 그대로 기본급으로 계산하고, 시간당 환산(월급 ÷ 월 근무시간)을
            기준으로 주휴/연장/야간/휴일 가산을 계산합니다. 산재보험은 업종별 요율이므로
            평균 요율을 기본값으로 두었고 실제 적용 요율로 조정하세요.
          </p>
        </div>
      </section>
    </div>
  );
}
