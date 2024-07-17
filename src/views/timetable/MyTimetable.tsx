import React, { FC } from "react";
import TimetableContent, { apolloClient } from "./TimetableContent";
import { Semester } from "types/modules";
import SemesterSwitcher from "views/components/semester-switcher/SemesterSwitcher";
import { deleteTimetableUser, resetAllTimetables } from "actions/timetables";
import {
  getRooms,
  subscribeToLessonChanges,
  subscribeToUserChanges,
} from "utils/graphql";
import { handleLessonChange } from "./TimetableContainer";
import { useDispatch, useSelector } from "react-redux";
import { State } from "types/state";
import { fillColorMapping } from "utils/colors";
import {
  getSemesterTimetableColors,
  getSemesterTimetableMultiLessons,
} from "selectors/timetables";
import { AuthContext } from "views/account/AuthContext";
import { Action } from "actions/constants";

const TimetableHeader: FC<{
  semester: Semester;
  onSelectSemester: (sem: number) => void;
  readOnly?: boolean;
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

  const userID = user?.userID ?? -1;
  const multiTimetableKeys = Object.keys(
    useSelector(({ timetables }: State) => timetables.multiUserLessons),
  );
  console.log({ multiTimetableKeys });

  const userTimetable = useSelector(getSemesterTimetableMultiLessons)(
    userID,
    semester,
  );

  const colors = useSelector(getSemesterTimetableColors)(semester);
  const filledColors = React.useMemo(
    () => fillColorMapping(userTimetable, colors),
    [colors, userTimetable],
  );

  console.log({ userTimetable, colors, filledColors });

  // Listen to changes from all joined rooms of the user
  const [rooms, setRooms] = React.useState<string[]>([]);
  React.useEffect(() => {
    dispatch(resetAllTimetables());

    getRooms(apolloClient).then((rooms) => {
      if (!rooms) return;

      setRooms(rooms);
      const subs = rooms.flatMap((roomID) => {
        const sub1 = subscribeToLessonChanges(
          apolloClient,
          roomID,
          handleLessonChange,
        );
        const sub2 = subscribeToUserChanges(
          apolloClient,
          roomID,
          (userChange) => {
            const { action, userID } = userChange;

            switch (action) {
              case Action.DELETE_USER: {
                dispatch(deleteTimetableUser(userID));
                return;
              }
            }
          },
        );

        return [sub1, sub2];
      });

      return () => {
        subs.forEach((s) => s.unsubscribe());
      };
    });
  }, []);

  return (
    <main className="overflow-auto pt-3">
      <div className="container">
        <TimetableContent
          readOnly={false}
          header={
            <TimetableHeader
              semester={semester}
              onSelectSemester={(semester) => setSemester(semester)}
              readOnly={false}
            />
          }
          semester={semester}
          multiTimetable={{}}
          colors={filledColors}
          roomID={undefined}
          userID={user?.userID ?? 0}
        />

        <h1 className="header">Debug</h1>
        {rooms.join(", ")}
        <br />
        {multiTimetableKeys.join(", ")}
      </div>
    </main>
  );
};
