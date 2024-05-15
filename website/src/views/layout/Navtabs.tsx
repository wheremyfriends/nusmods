import type { FC } from 'react';
import { useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';
import classnames from 'classnames';
import {
  BookOpen,
  Calendar,
  Clock,
  Heart,
  Map,
  Settings,
  Star,
  Target,
  Trello,
} from 'react-feather';

import { showCPExTab } from 'featureFlags';
import ExternalLink from 'views/components/ExternalLink';
import { timetablePage } from 'views/routes/paths';
import type { State } from 'types/state';

import styles from './Navtabs.scss';

export const NAVTAB_HEIGHT = 48;

const Navtabs: FC = () => {
  const activeSemester = useSelector(({ app }: State) => app.activeSemester);
  const beta = useSelector(({ settings }: State) => settings.beta);

  const tabProps = {
    className: styles.link,
    activeClassName: styles.linkActive,
  };

  return (
    <nav className={styles.nav}>
      <NavLink {...tabProps} to={timetablePage(activeSemester)}>
        <Calendar />
        <span className={styles.title}>Timetable</span>
      </NavLink>
      {showCPExTab && (
        <NavLink {...tabProps} to="/cpex">
          <Target />
          <span className={styles.title}>CPEx</span>
        </NavLink>
      )}
      {beta && (
        <NavLink
          {...tabProps}
          className={classnames(tabProps.className, styles.hiddenOnMobile)}
          to="/planner"
        >
          <Trello />
          <span className={styles.title}>Planner</span>
        </NavLink>
      )}
      <div className={styles.divider} />
    </nav>
  );
};

export default Navtabs;
