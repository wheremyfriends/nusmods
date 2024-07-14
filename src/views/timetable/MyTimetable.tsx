import React, { FC } from "react";
import TimetableContent, { apolloClient } from "./TimetableContent";
import { Semester } from "types/modules";
import SemesterSwitcher from "views/components/semester-switcher/SemesterSwitcher";
import { resetAllTimetables } from "actions/timetables";
import { getRooms, subscribeToLessonChanges } from "utils/graphql";
import { handleLessonChange } from "./TimetableContainer";
import { useDispatch, useSelector } from "react-redux";
import { State } from "types/state";
import { fillColorMapping } from "utils/colors";
import {
  getSemesterTimetableColors,
  getSemesterTimetableMultiLessons,
} from "selectors/timetables";
import { AuthContext } from "views/account/AuthContext";

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
  const { user, setUser } = React.useContext(AuthContext)!;
  const [semester, setSemester] = React.useState(1);
  const dispatch = useDispatch();

  const userID = 47;
  const multiTimetable = useSelector(getSemesterTimetableMultiLessons)(
    userID,
    semester,
  );
  const colors = useSelector(getSemesterTimetableColors)(semester);
  const filledColors = React.useMemo(
    () => fillColorMapping(multiTimetable, colors),
    [colors, multiTimetable],
  );

  // Listen to changes from all joined rooms of the user
  const [rooms, setRooms] = React.useState<string[]>([]);
  React.useEffect(() => {
    dispatch(resetAllTimetables());

    getRooms(apolloClient).then((rooms) => {
      if (!rooms) return;

      setRooms(rooms);
      rooms.forEach((room) => {
        subscribeToLessonChanges(apolloClient, room, handleLessonChange);
      });
    });
  }, []);

  return (
    <div className="container">
      {rooms.join(", ")}
      <TimetableContent
        readOnly={false}
        header={
          <TimetableHeader
            semester={semester}
            onSelectSemester={(semester) => setSemester(semester)}
            readOnly={false}
            roomID="room1"
          />
        }
        semester={semester}
        multiTimetable={{}}
        colors={filledColors}
        roomID="room1"
        userID={user!.userID}
      />
    </div>
  );
};
