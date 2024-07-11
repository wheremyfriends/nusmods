import React, { FC } from "react";
import TimetableContent from "./TimetableContent";
import { Semester } from "types/modules";
import SemesterSwitcher from "views/components/semester-switcher/SemesterSwitcher";

const TimetableHeader: FC<{
  semester: Semester;
  onSelectSemester: (sem: number) => void;
  readOnly?: boolean;
  roomID: String;
}> = ({ semester, readOnly, onSelectSemester }) => {
  return (
    <SemesterSwitcher
      semester={semester}
      onSelectSemester={onSelectSemester}
      readOnly={readOnly}
    />
  );
};
export const MyTimetable = () => {
  const [semester, setSemester] = React.useState(1);

  // 1. Subscribe to changes of all the rooms the user is joined

  return (
    <div className="container">
      <TimetableContent
        readOnly={false}
        header={
          <>
            <TimetableHeader
              semester={semester}
              onSelectSemester={(semester) => setSemester(semester)}
              readOnly={false}
              roomID="whyareyouhere"
            />
          </>
        }
        semester={semester}
        multiTimetable={{}}
        colors={{}}
        roomID="whyareyouhere"
        userID={1}
      />
    </div>
  );
};
