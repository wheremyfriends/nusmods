import Modal from "./Modal";
import React from "react";
import { X } from "react-feather";
import Input from "./Input";
import SwitchWithText from "./SwitchWithText";
import { TimetableGeneratorConfig } from "types/timetables";
import { useSelect } from "downshift";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "types/reducers";
import { updateTimetableGenConf } from "actions/app";

type Break = {
  start: string;
  end: string;
};

// Returns true if invalid, false if valid
// Ensures that input is multiple of 30 minutes
function isTimeInvalid(value: Date) {
  return !(value.getMinutes() % 30 === 0 && value.getSeconds() === 0);
}

// Converts a number to string, returning defVal if input is negative
function positiveNumberToStr(value: number, defVal: string = ""): string {
  if (value < 0) return defVal;
  return value.toString();
}

// If value if negative, return default, else return value
function nonEmptyStrToNumber(value: string, defVal: number = -1): number {
  if (value === "") return defVal;
  return parseFloat(value);
}
type Props = {
  isOpen: boolean;
  onClose: () => void;
  onChange: (config: TimetableGeneratorConfig) => void;
};
export default function TimetableGeneratorConfigModal({
  isOpen,
  onClose,
  onChange,
}: Props) {
  const config = useSelector((state: any) => {
    return (state.app as AppState).timetableGeneratorConfig;
  });
  const dispatch = useDispatch();

  const [breaks, setBreaks] = React.useState<Break[]>(
    config.breaks?.length >= 1
      ? config.breaks[0].timeslots.map(({ start, end }) => ({
          start: positiveNumberToStr(start),
          end: positiveNumberToStr(end),
        }))
      : [{ start: "", end: "" }],
  );
  const [prefDays, setPrefDays] = React.useState<string>(
    config.prefDays.filter((d) => d >= 0).join(", "),
  );
  const [maxDist, setMaxDist] = React.useState<string>(
    positiveNumberToStr(config.maxDist),
  );

  const [minBreakDuration, setMinBreakDuration] = React.useState<string>(
    positiveNumberToStr(config.breaks?.[0]?.minDuration),
  );

  const [prefDaysEnabled, setPrefDaysEnabled] = React.useState<boolean>(
    config.prefDaysEnabled,
  );
  const [maxDistEnabled, setMaxDistEnabled] = React.useState<boolean>(
    config.maxDistEnabled,
  );
  const [breaksEnabled, setBreaksEnabled] = React.useState<boolean>(
    config.breaksEnabled,
  );

  function editBreak(property: string, newVal: string, index: number) {
    const newBreaks = breaks.map((b, i) => {
      if (i !== index) return b;
      else
        return {
          ...b,
          [property]: newVal,
        };
    });

    setBreaks(newBreaks);
  }

  function handleClose() {
    const config: TimetableGeneratorConfig = {
      prefDaysEnabled,
      maxDistEnabled,
      breaksEnabled,
      prefDays: prefDays
        .split(",")
        .filter((d) => d.trim() !== "")
        .map((d) => nonEmptyStrToNumber(d.trim())),
      maxDist: nonEmptyStrToNumber(maxDist),
      breaks: [
        {
          minDuration: nonEmptyStrToNumber(minBreakDuration!),
          timeslots: breaks.map(({ start, end }) => {
            return {
              start: nonEmptyStrToNumber(start.replace(":", "")),
              end: nonEmptyStrToNumber(end.replace(":", "")),
            };
          }),
        },
      ],
    };
    dispatch(updateTimetableGenConf(config));
    onChange(config);
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onRequestClose={handleClose} animate>
      <h1>Configuration</h1>
      Configuration for the timetable generation algorithm
      <hr className="mt-5" />
      <fieldset>
        <SwitchWithText
          checked={prefDaysEnabled}
          onCheckedChange={setPrefDaysEnabled}
        />
        <Input
          label="Preferred Days"
          placeholder="5, 3, 4"
          helperText="Ranking of days separated by comma. 0 = Sunday, 1 = Monday etc"
          disabled={!prefDaysEnabled}
          value={prefDays}
          onChange={(e) => setPrefDays(e.target.value)}
        />
      </fieldset>
      <hr className="mt-5" />
      <fieldset>
        <SwitchWithText
          checked={maxDistEnabled}
          onCheckedChange={setMaxDistEnabled}
        />
        <Input
          type="number"
          label="Maximum Distance (km)"
          helperText="Maximum allowable travel distance for back to back classes"
          placeholder="0.8"
          disabled={!maxDistEnabled}
          value={maxDist}
          onChange={(e) => setMaxDist(e.target.value)}
        />
      </fieldset>
      <hr className="mt-5" />
      <fieldset>
        <SwitchWithText
          checked={breaksEnabled}
          onCheckedChange={setBreaksEnabled}
        />
        <Input
          type="number"
          label="Minimum Break Duration (mins)"
          helperText="Minimum consecutive minutes to be free from classes"
          placeholder="60"
          disabled={!breaksEnabled}
          value={minBreakDuration}
          onChange={(e) => setMinBreakDuration(e.target.value)}
        />
        <div
          className="grid gap-x-2 gap-y-2 items-end"
          style={{ gridTemplateColumns: "1fr 1fr auto" }}
        >
          {breaks.map((b, ind) => (
            <React.Fragment key={ind}>
              <Input
                label={ind === 0 ? "Start" : undefined}
                type="time"
                disabled={!breaksEnabled}
                value={b.start}
                onChange={(event) => {
                  editBreak("start", event.target.value, ind);
                }}
              />
              <Input
                label={ind === 0 ? "End" : undefined}
                type="time"
                disabled={!breaksEnabled}
                value={b.end}
                onChange={(event) => {
                  editBreak("end", event.target.value, ind);
                }}
              />
              <button
                className="btn btn-outline-secondary"
                onClick={() => {
                  setBreaks(breaks.filter((_, i) => i !== ind));
                }}
              >
                <X />
              </button>
            </React.Fragment>
          ))}
        </div>
        <button
          className="btn btn-outline-primary mt-5"
          onClick={() => {
            setBreaks([...breaks, { start: "", end: "" }]);
          }}
        >
          Add time range
        </button>
        <div className="text-sm text-grey-900">
          The reason for multiple time ranges is to allow for you to have
          disjointed break (e.g 11am-12pm and 1pm-2pm)
        </div>
      </fieldset>
    </Modal>
  );
}
