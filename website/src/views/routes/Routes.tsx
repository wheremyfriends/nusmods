import * as React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import TimetableContainer from 'views/timetable/TimetableContainer';
import NotFoundPage from 'views/errors/NotFoundPage';

// IMPORTANT: Remember to update any route changes on the sitemap
const Routes: React.FC = () => (
  <Switch>
    <Redirect exact from="/" to="/timetable" />
    <Route path="/timetable/:semester?/:action?" component={TimetableContainer} />

    {/* 404 page */}
    <Route component={NotFoundPage} />
  </Switch>
);

export default Routes;
