import { init2DArr } from "./utils";
import { Roarr as log } from "roarr";

// Terminologies
// Module > Lesson > Class > Timeslots

const HOURS_IN_DAY = 24;
const DAYS_IN_WEEK = 7;
const NO_SOL_ERR_MSG = "No Solution";

enum Status {
  FREE,
  ALLOCATED,
}

enum Day {
  SUNDAY,
  MONDAY,
  TUESDAY,
  WEDNESDAY,
  THURSDAY,
  FRIDAY,
  SATURDAY,
}

type Cls = {
  moduleCode: string;
  lessonType: string;
  classNo: string;
  priority: number;
  timeslots: TimeSlot[];
};
export type TimeSlot = {
  moduleCode: string;
  lessonType: string;
  classNo: string;
  startTime: number;
  endTime: number;
  day: Day;
  [key: string]: any;
};

export class Solver {
  // Keep track of allocation status
  isFree: Status[][];
  isLessonAllocated: Map<string, boolean>;

  allClasses: Cls[]; // All classes to consider
  curClasses: Cls[]; // Working Set
  result: Cls[][]; // Working Set

  // Additional information to terminate branch early
  numClassPerLesson: { [key: string]: number };

  // Limit Number of Solutions
  maxsols: number;
  numsols: number;

  constructor(input: any[][], index: number) {
    const allUsersClasses: any[] = [];
    input.forEach((lessons) => {
      allUsersClasses.push(Solver.groupIntoClases(lessons));
    });

    // Find "priority" of each lesson slot
    const coursePriority = Solver.calculatePriority(allUsersClasses);

    const allClasses = Solver.assignPriority(
      allUsersClasses[index],
      coursePriority,
    );

    this.numsols = 0;
    this.maxsols = -1;

    this.curClasses = [];
    this.result = [];

    this.isLessonAllocated = new Map();
    this.isFree = init2DArr<Status>(DAYS_IN_WEEK, HOURS_IN_DAY, Status.FREE);
    const { classes, numClassPerLesson } = this.preallocateMods(allClasses);
    this.numClassPerLesson = numClassPerLesson;
    this.allClasses = classes;
    this.allClasses.sort((a: Cls, b: Cls) => {
      return b.priority - a.priority;
    });

    log(Object(this.allClasses), "this.allClasses");
    log(this.numClassPerLesson, "this.numClassPerLesson");
  }

  static getLessonKey(cls: { moduleCode: string; lessonType: string }) {
    return `${cls.moduleCode} ${cls.lessonType}`.toLowerCase();
  }

  static getClassKey(cls: {
    moduleCode: string;
    lessonType: string;
    classNo: string;
  }) {
    return `${this.getLessonKey(cls)} ${cls.classNo}`.toLowerCase();
  }

  static calculatePriority(allClasess: Cls[][]): { [key: string]: number } {
    const freq: { [key: string]: number } = {};
    allClasess.forEach((userClasses) => {
      userClasses.forEach((cls: Cls) => {
        const key = Solver.getClassKey(cls);

        if (key in freq) freq[key] += 1;
        else freq[key] = 1;
      });
    });

    return freq;
  }

  static assignPriority(classes: Cls[], priority: { [key: string]: number }) {
    classes = classes.map((c: Cls) => {
      const key = Solver.getClassKey(c);

      if (!(key in priority)) return c;

      return { ...c, priority: priority[key] };
    });

    return classes;
  }

  static groupIntoClases(lessons: any[]) {
    const classToTimeSlot: { [key: string]: Cls } = {};
    lessons.forEach((l: TimeSlot) => {
      const key = Solver.getClassKey(l);

      if (key in classToTimeSlot) {
        classToTimeSlot[key].timeslots.push(l);
      } else {
        classToTimeSlot[key] = {
          moduleCode: l.moduleCode,
          lessonType: l.lessonType,
          classNo: l.classNo,
          priority: 0,
          timeslots: [l],
        };
      }
    });

    const classes = Object.values(classToTimeSlot);

    return classes;
  }

  static getNumClassPerLesson(classes: Cls[]) {
    const freq: { [key: string]: number } = {};
    classes.forEach((c: Cls) => {
      const key = Solver.getLessonKey(c);
      if (key in freq) freq[key]++;
      else freq[key] = 1;
    });

    return freq;
  }

  preallocateMods(classes: Cls[]) {
    let numClassPerLesson = Solver.getNumClassPerLesson(classes);

    classes.forEach((cls: Cls) => {
      const lessonKey = Solver.getLessonKey(cls);

      const numclasses = numClassPerLesson[lessonKey];

      if (numclasses > 1) return;

      if (!Solver.checkAvail(this.isFree, cls.timeslots))
        throw new Error(NO_SOL_ERR_MSG);

      this.setTimetable(cls);

      this.curClasses.push(cls);
    });

    // Remove unwanted classes
    classes = classes.filter((cls: Cls) => {
      const lessonKey = Solver.getLessonKey(cls);
      const numclasses = numClassPerLesson[lessonKey];
      return numclasses > 1;
    });

    // Remove unwanted classes
    numClassPerLesson = Object.fromEntries(
      Object.entries(numClassPerLesson).filter(([_, value]) => {
        return value > 1;
      }),
    );

    return {
      numClassPerLesson,
      classes,
    };
  }

  resetTimetable(cls: Cls) {
    cls.timeslots.forEach((ts: TimeSlot) => {
      Solver.setTimetableVal(this.isFree, ts, Status.FREE);
    });
  }

  setTimetable(cls: Cls) {
    cls.timeslots.forEach((ts: TimeSlot) => {
      Solver.setTimetableVal(this.isFree, ts, Status.ALLOCATED);
    });
  }

  static setTimetableVal(bitmap: Status[][], timeslot: TimeSlot, val: Status) {
    for (let i = timeslot.startTime; i < timeslot.endTime; i++) {
      bitmap[timeslot.day][i] = val;
    }
  }

  static checkAvail(bitmap: Status[][], timeslots: TimeSlot[]) {
    for (let ts of timeslots) {
      for (let i = ts.startTime; i < ts.endTime; i++) {
        if (bitmap[ts.day][i] == Status.ALLOCATED) return false;
      }
    }
    return true;
  }

  solve(maxsols: number = -1) {
    this.maxsols = maxsols;
    this._solve(0, Object.keys(this.numClassPerLesson).length);

    log(Object(this.result), "this.result");
    if (this.result.length <= 0) throw new Error(NO_SOL_ERR_MSG);

    return this.result;
  }

  _solve(counter: number, numlessons: number): void {
    if (this.maxsols > 0 && this.numsols >= this.maxsols) {
      return;
    }

    if (numlessons <= 0) {
      this.numsols++;

      // Save solution
      log(Object(this.curClasses), "Solution");
      // Deep Copy for minimal confusion
      const solution = JSON.parse(JSON.stringify(this.curClasses));
      // const solution = this.curClasses;
      this.result.push(solution);
      return;
    }

    if (counter == this.allClasses.length) {
      // Base Case
      // guarantees algorithm terminate
      return;
    }
    const curCls = this.allClasses[counter];
    const lessonKey = Solver.getLessonKey(curCls);

    this.numClassPerLesson[lessonKey]--;

    // For every mod, make the decision to choose or don't choose
    // Choice 1: Pick
    const isAvail = Solver.checkAvail(this.isFree, curCls.timeslots);
    const isAllocated: boolean = !!this.isLessonAllocated.get(lessonKey);

    if (isAvail && !isAllocated) {
      this.setTimetable(curCls);
      this.isLessonAllocated.set(lessonKey, true);
      this.curClasses.push(curCls);

      this._solve(counter + 1, numlessons - 1);

      this.resetTimetable(curCls);
      this.isLessonAllocated.set(lessonKey, false);
      this.curClasses.pop();
    }

    // Choice 2: Don't pick
    this._solve(counter + 1, numlessons);

    this.numClassPerLesson[lessonKey]++;
  }
}
