# Solver

## Input/Output

Output is the same as input with a few missing mods

```json
[
    // User 1
    [
        {
            "moduleCode": "CS2040C",
            "lessonType": "Lecture",
            "classNo": "01",
            "startTime": "0900",
            "endTime": "1000",
            "day": "Monday",
            ... // Any other keys
        },
        {
            "moduleCode": "CS2040C",
            "lessonType": "Laboratory",
            "classNo": "L04",
            "startTime": "0900",
            "endTime": "1000",
            "day": "Tuesday",
        }
    ],

    // User 2
    [
        {
            "moduleCode": "CS2040C",
            "lessonType": "Lecture",
            "classNo": "01",
            "startTime": "0900",
            "endTime": "1000",
            "day": "Monday",
        }
    ]
]
```

## Usage

```js
import { getOptimisedTimetable } from "solver";

getOptimisedTimetable(
  timetables, // Object defined above
  1, // Index of the current user (with respect to the array above)
  5, // Max # of solutions
);
```

## Algorithm Description

Exhaustive Search

```mermaid
flowchart TB
    subgraph CS2100 T03
        a
    end
    subgraph CS2040C L04
        b
        c
    end
    subgraph CS2040C L05
        d
        e
        f
        g
    end
    a( ) -- Yes--> b( )
    a( ) -- No --> c( )
    b( ) -- Yes --> d( )
    b( ) -- No --> e( )
    c( ) -- Yes --> f( )
    c( ) -- No --> g( )
    d -- Yes --> h( )
    d -- No --> i( )
    e -- Yes --> j( )
    e -- No --> k( )
    f -- Yes --> l( )
    f -- No --> m( )
    g -- Yes --> n( )
    g -- No --> o( )
```
