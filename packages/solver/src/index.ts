import { TimeSlot, TS, Solver } from "./solver";
import { preprocess, postprocess } from "./utils";

export function getOptimisedTimetable(
  timetables: TimeSlot[][],
  index: number,
  maxsols: number = -1,
) {
  const processedTimetable: TS[][] = timetables.map((e) => {
    return preprocess(e);
  });

  const solver = new Solver(processedTimetable, index);
  const solvedTimetable = solver.solve(maxsols);

  const ret: TimeSlot[][] = [];
  solvedTimetable.forEach((timetable) => {
    let retTimetable: TimeSlot[] = [];
    timetable.forEach((cls) => {
      retTimetable = retTimetable.concat(postprocess(cls.timeslots));
    });

    ret.push(retTimetable);
  });

  return ret;
}
