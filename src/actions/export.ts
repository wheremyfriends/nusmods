import type { Module, ModuleCode, Semester, UserID } from "types/modules";
import type { ExportData } from "types/export";
import type { Dispatch, GetState } from "types/redux";
import { hydrateSemTimetableWithMultiLessons } from "utils/timetables";
import { captureException } from "utils/error";
import retryImport from "utils/retryImport";
import { getSemesterTimetableMultiLessons } from "selectors/timetables";
import { SET_EXPORTED_DATA } from "./constants";

function downloadUrl(blob: Blob, filename: string) {
  const link = document.createElement("a");
  if (window.navigator.msSaveOrOpenBlob) {
    window.navigator.msSaveOrOpenBlob(blob, filename);
  } else {
    const objectUrl = URL.createObjectURL(blob);
    link.download = filename;
    link.href = objectUrl;
    link.dispatchEvent(new MouseEvent("click"));
    URL.revokeObjectURL(objectUrl);
  }
}

export const SUPPORTS_DOWNLOAD = "download" in document.createElement("a");

export function downloadAsIcal(userID: UserID, semester: Semester) {
  return (_dispatch: Dispatch, getState: GetState) => {
    Promise.all([
      retryImport(
        () => import(/* webpackChunkName: "export" */ "ical-generator"),
      ),
      retryImport(() => import(/* webpackChunkName: "export" */ "utils/ical")),
    ])
      .then(([ical, icalUtils]) => {
        const state = getState();
        const { modules } = state.moduleBank;
        const hiddenModules: ModuleCode[] =
          state.timetables.multiUserHidden?.[userID]?.[semester] || [];

        const timetable = getSemesterTimetableMultiLessons(state)(
          userID,
          semester,
        );
        const timetableWithLessons = hydrateSemTimetableWithMultiLessons(
          timetable,
          modules,
          semester,
        );
        // const timetableWithLessons = hydrateSemTimetableWithLessons(timetable, modules, semester);

        const events = icalUtils.default(
          semester,
          timetableWithLessons,
          modules,
          hiddenModules,
        );
        const cal = ical.default({
          domain: "nusmods.com",
          prodId: "//NUSMods//NUSMods//EN",
          events,
        });

        const blob = new Blob([cal.toString()], { type: "text/calendar" });
        downloadUrl(blob, "nusmods_calendar.ics");
      })
      .catch(captureException);
  };
}

export function setExportedData(modules: Module[], data: ExportData) {
  return {
    type: SET_EXPORTED_DATA,
    payload: {
      modules,
      ...data,
    },
  };
}
