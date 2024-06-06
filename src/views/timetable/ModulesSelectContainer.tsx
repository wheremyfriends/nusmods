import { Component } from 'react';
import { connect } from 'react-redux';

import { ModuleSelectList } from 'types/reducers';
import { ModuleCode, Semester } from 'types/modules';
import { SemTimetableConfig, SemTimetableMultiConfig } from 'types/timetables';

import Online from 'views/components/Online';
import { popNotification } from 'actions/app';
import { getSemModuleSelectList } from 'selectors/moduleBank';
import { createSearchPredicate, sortModules } from 'utils/moduleSearch';
import { State as StoreState } from 'types/state';
import ModulesSelect from './ModulesSelect';

type OwnProps = {
  multiTimetable: SemTimetableMultiConfig;
  semester: Semester;
};

type Props = OwnProps & {
  moduleList: ModuleSelectList;
  addModule: (semester: Semester, moduleCode: ModuleCode) => void;
  removeModuleRT: (moduleCode: ModuleCode) => void;
  popNotification: () => void;
};

const RESULTS_LIMIT = 500;

/**
 * Container for modules select
 * Governs the module filtering logic and non-select related logic such as notification.
 */
class ModulesSelectContainer extends Component<Props> {
  onChange = (moduleCode: ModuleCode) => {
    this.props.popNotification();
    this.props.addModule(this.props.semester, moduleCode);
  };

  getFilteredModules = (inputValue: string | null) => {
    if (!inputValue) return [];
    const predicate = createSearchPredicate(inputValue);
    const results = this.props.moduleList.filter(predicate);
    return sortModules(inputValue, results.slice(0, RESULTS_LIMIT));
  };

  override render() {
    return (
      <Online>
        {(isOnline) => (
          <ModulesSelect
            getFilteredModules={this.getFilteredModules}
            moduleCount={this.props.moduleList.length}
            onChange={this.onChange}
            placeholder={
              isOnline ? 'Add course to timetable' : 'You need to be online to add courses'
            }
            disabled={!isOnline}
            onRemoveModule={this.props.removeModuleRT}
          />
        )}
      </Online>
    );
  }
}

function mapStateToProps(state: StoreState, ownProps: OwnProps) {
  const { semester, multiTimetable } = ownProps;
  const moduleList = getSemModuleSelectList(state, semester, multiTimetable);

  return {
    semester,
    moduleList,
  };
}

export default connect(mapStateToProps, {
  popNotification,
})(ModulesSelectContainer);
