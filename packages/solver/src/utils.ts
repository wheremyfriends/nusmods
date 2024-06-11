import { TimeSlot, TS } from "./solver";

/**
 * Converts day (e.g Monday/Tuesday/Wednesday) to its corresponding number.
 * 0 - Sunday
 * 1 - Monday
 * etc
 */
export function convertDaytoNumber(inp: string): number {
  const days: { [key: string]: number } = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };

  return days[inp];
}

export function convertNumbertoDay(inp: number): string {
  const days: string[] = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  return days[inp];
}

export function init2DArr<T>(row: number, col: number, initval: T): T[][] {
  let output: T[][] = [];

  for (let i = 0; i < row; i++) {
    output.push(new Array<T>(col).fill(initval));
  }

  return output;
}

export function preprocess(timeslots: TimeSlot[]) {
  return timeslots.map((ts) => {
    return {
      ...ts,
      startTime: parseInt(ts["startTime"]) / 100,
      endTime: parseInt(ts["endTime"]) / 100,
      day: convertDaytoNumber(ts["day"]),
    };
  });
}

export function postprocess(timeslots: TS[]) {
  return timeslots.map((ts) => {
    return {
      ...ts,
      startTime: (ts["startTime"] * 100).toString().padStart(4, "0"),
      endTime: (ts["endTime"] * 100).toString().padStart(4, "0"),
      day: convertNumbertoDay(ts["day"]),
    };
  });
}
