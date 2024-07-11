import * as React from "react";
import { Redirect, Route, Switch } from "react-router-dom";

import TimetableContainer from "views/timetable/TimetableContainer";
import RecentRooms from "views/rooms/RecentRooms";
import NotFoundPage from "views/errors/NotFoundPage";
import { MyTimetable } from "views/timetable/MyTimetable";

// IMPORTANT: Remember to update any route changes on the sitemap
const Routes: React.FC = () => (
  <Switch>
    <Route path="/rooms" component={RecentRooms} />
    <Route path="/me" component={MyTimetable} />
    <Route path="/:roomID?" component={TimetableContainer} />

    {/* 404 page */}
    <Route component={NotFoundPage} />
  </Switch>
);

export default Routes;
