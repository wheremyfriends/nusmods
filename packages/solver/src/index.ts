import { TimeSlot, Solver } from "./solver";
import { preprocess, postprocess } from "./utils";

export function getOptimisedTimetable(
  timetables: any[],
  index: number,
  maxsols: number = -1,
) {
  timetables = timetables.map((e) => {
    return preprocess(e);
  });

  const solver = new Solver(timetables, index);
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
