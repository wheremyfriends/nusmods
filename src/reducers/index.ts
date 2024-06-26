import { REMOVE_MODULE, SET_TIMETABLE } from "actions/timetables";

import persistReducer from "storage/persistReducer";
import { State } from "types/state";
import { Actions } from "types/actions";

// Non-persisted reducers
import requests from "./requests";
import createUndoReducer from "./undoHistory";
import timetables from "./timetables";
import moduleBank from "./moduleBank";
import venueBank from "./venueBank";
import planner from "./planner";

// Persisted reducers
import appReducer, { persistConfig as appPersistConfig } from "./app";
import themeReducer from "./theme";
import settingsReducer, {
  persistConfig as settingsPersistConfig,
} from "./settings";

// Persist reducers
const app = persistReducer("app", appReducer, appPersistConfig);
const theme = persistReducer("theme", themeReducer);
const settings = persistReducer(
  "settings",
  settingsReducer,
  settingsPersistConfig,
);

// State default is delegated to its child reducers.
const defaultState = {} as unknown as State;
const undoReducer = createUndoReducer<State>({
  limit: 1,
  actionsToWatch: [REMOVE_MODULE, SET_TIMETABLE],
  storedKeyPaths: ["timetables", "theme.colors"],
});

export default function reducers(
  state: State = defaultState,
  action: Actions,
): State {
  // Update every reducer except the undo reducer
  const newState: State = {
    moduleBank: moduleBank(state.moduleBank, action),
    venueBank: venueBank(state.venueBank, action),
    requests: requests(state.requests, action),
    timetables: timetables(state.timetables, action),
    app: app(state.app, action),
    theme: theme(state.theme, action),
    settings: settings(state.settings, action),
    planner: planner(state.planner, action),
    undoHistory: state.undoHistory,
  };
  return undoReducer(state, newState, action);
}
