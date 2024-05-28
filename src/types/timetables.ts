import { ClassNo, LessonType, ModuleCode, ModuleTitle, RawLesson, Semester } from './modules';

//  ModuleLessonConfig is a mapping of lessonType to ClassNo for a module.
export type ModuleLessonConfig = {
  [lessonType: string]: ClassNo;
};

// SemTimetableConfig is the timetable data for each semester.
export type SemTimetableConfig = {
  [moduleCode: string]: ModuleLessonConfig;
};

//  ModuleLessonMultiConfig is a mapping of lessonType to ClassNo array for a module.
export type ModuleLessonMultiConfig = {
  [lessonType: string]: ClassNo[];
};

// SemTimetableMultiConfig is the timetable data for each semester that supports multiple ClassNo.
export type SemTimetableMultiConfig = {
  [moduleCode: string]: ModuleLessonMultiConfig;
};

// TimetableMultiConfig is the timetable data for each semester that supports multiple ClassNo.
export type TimetableMultiConfig = {
  [semester: string]: SemTimetableMultiConfig;
};

export type EditingType = {
  readonly moduleCode: ModuleCode;
  readonly lessonType: LessonType;
};

//  ModuleLessonConfigWithLessons is a mapping of lessonType to an array of Lessons for a module.
export type Lesson = RawLesson & {
  moduleCode: ModuleCode;
  title: ModuleTitle;
};

export type ColoredLesson = Lesson & {
  colorIndex: ColorIndex;
};

type Modifiable = {
  isModifiable?: boolean;
  isAvailable?: boolean;
  isActive?: boolean;
  colorIndex: ColorIndex;
};

export type ModifiableLesson = ColoredLesson & Modifiable;
//  The array of Lessons must belong to that lessonType.
export type ModuleLessonConfigWithLessons = {
  [lessonType: string]: Lesson[];
};

// SemTimetableConfig is the timetable data for each semester with lessons data.
export type SemTimetableConfigWithLessons = {
  [moduleCode: string]: ModuleLessonConfigWithLessons;
};


// TimetableConfig is the timetable data for the whole academic year.
export type TimetableConfig = {
  [semester: string]: SemTimetableConfig;
};

// TimetableDayFormat is timetable data grouped by DayText.
export type TimetableDayFormat = {
  [dayText: string]: ColoredLesson[];
};

// TimetableDayArrangement is the arrangement of lessons on the timetable within a day.
export type TimetableDayArrangement = ModifiableLesson[][];

// TimetableArrangement is the arrangement of lessons on the timetable for a week.
export type TimetableArrangement = {
  [dayText: string]: TimetableDayArrangement;
};

// Represents the lesson which the user is currently hovering over.
// Used to highlight lessons which have the same classNo
export type HoverLesson = {
  readonly classNo: ClassNo;
  readonly moduleCode: ModuleCode;
  readonly lessonType: LessonType;
};

export type ColorIndex = number;

export type LessonChange = {
  readonly action: String;
  readonly name: String;
  readonly semester: Semester;
  readonly moduleCode: ModuleCode;
  readonly lessonType: LessonType;
  readonly classNo: ClassNo;
}