declare enum Day {
    SUNDAY = 0,
    MONDAY = 1,
    TUESDAY = 2,
    WEDNESDAY = 3,
    THURSDAY = 4,
    FRIDAY = 5,
    SATURDAY = 6
}
type TimeSlot = {
    moduleCode: string;
    lessonType: string;
    classNo: string;
    startTime: number;
    endTime: number;
    day: Day;
    [key: string]: any;
};

declare function getOptimisedTimetable(timetables: any[], index: number, maxsols?: number): TimeSlot[][];

export { getOptimisedTimetable };
