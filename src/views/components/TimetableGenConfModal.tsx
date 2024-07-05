import Modal from "./Modal";
import React from "react";
import { X } from "react-feather";
import Input from "./Input";
import SwitchWithText from "./SwitchWithText";
import { TimetableGeneratorConfig } from "types/timetables";

type Break = {
  start: string;
  end: string;
};

// Returns true if invalid, false if valid
// Ensures that input is multiple of 30 minutes
function isTimeInvalid(value: Date) {
  return !(value.getMinutes() % 30 === 0 && value.getSeconds() === 0);
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
  const [breaks, setBreaks] = React.useState<Break[]>([{ start: "", end: "" }]);
  const [prefDays, setPrefDays] = React.useState<string>("");
  const [maxDist, setMaxDist] = React.useState<string>("");
  const [minBreakDuration, setMinBreakDuration] = React.useState<string>("");

  const [prefDaysEnabled, setPrefDaysEnabled] = React.useState<boolean>(false);
  const [maxDistEnabled, setMaxDistEnabled] = React.useState<boolean>(false);
  const [breakEnabled, setBreakEnabled] = React.useState<boolean>(false);

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
      prefDays: prefDaysEnabled
        ? prefDays.split(",").map((d) => {
            d = d.trim();
            return parseInt(d);
          })
        : [],
      maxDist: maxDistEnabled ? parseFloat(maxDist) : -1,
      breaks: breakEnabled
        ? [
            {
              minDuration: parseInt(minBreakDuration!),
              timeslots: breaks.map(({ start, end }) => {
                return {
                  start: parseInt(start.replace(":", "")),
                  end: parseInt(end.replace(":", "")),
                };
              }),
            },
          ]
        : [],
    };
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
          helperText="describe help text"
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
          placeholder="0.8"
          disabled={!maxDistEnabled}
          value={maxDist}
          onChange={(e) => setMaxDist(e.target.value)}
        />
      </fieldset>
      <hr className="mt-5" />
      <fieldset>
        <SwitchWithText
          checked={breakEnabled}
          onCheckedChange={setBreakEnabled}
        />
        <Input
          type="number"
          label="Minimum Break Duration (mins)"
          placeholder="60"
          disabled={!breakEnabled}
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
                disabled={!breakEnabled}
                value={b.start}
                onChange={(event) => {
                  editBreak("start", event.target.value, ind);
                }}
              />
              <Input
                label={ind === 0 ? "End" : undefined}
                type="time"
                disabled={!breakEnabled}
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
          style={{ margin: "1.5rem 0" }}
          className="btn btn-outline-primary"
          onClick={() => {
            setBreaks([...breaks, {}]);
          }}
        >
          Add time range
        </button>
      </fieldset>
    </Modal>
  );
}
