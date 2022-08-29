import { API_URL } from "../Config";

// this exporter is only used if you need to have raw fetch() access!
// otherwise you can use the default exporter

export const getApiURL = () => API_URL;

export const getTimetableForID = (id, from, to) =>
  fetch(
    `${API_URL}/v1/timetable/${id}?from=${from ? new Date(from).toISOString().substring(0, 10) : ""}&to=${
      to ? new Date(to).toISOString().substring(0, 10) : ""
    }`,
  ).then(response => response.json());

// the TE Public API does not want to give this, so we got it the manual way
export const getCollegas = () =>
  [
    { value: "244877.3", label: "Maartje Eyskens" },
    { value: "245069.3", label: "Joeri Verlooy" },
    { value: "378880.3", label: "Brent Pulmans" },
    { value: "245084.3", label: "Quinten Desmyter" },
    { value: "240632.3", label: "Ann Hannes" },
    { value: "240760.3", label: "Jochen Mariën" },
    { value: "244864.3", label: "Joren Synaeve" },
    { value: "240913.3", label: "Maarten Van Lint" },
    { value: "244742.3", label: "Karen Verswijvel" },
  ].sort((a, b) => a.label.localeCompare(b.label));

export const getCampus = () =>
  [
    { value: "TM/KU Leuven Campus Geel", label: "TM/KU Leuven Campus Geel" },
    { value: "TM - Campus Lier", label: "TM - Campus Lier" },
    { value: "TM - Campus Turnhout", label: "TM - Campus Turnhout" },
    { value: "TM - Campus Vorselaar", label: "TM - Campus Vorselaar" },
  ].sort((a, b) => a.label.localeCompare(b.label));

export const getClassesForQuery = query => fetch(`${API_URL}/v1/classes/search?query=${encodeURIComponent(query)}`).then(response => response.json());

export const getRoomsForCampus = query => fetch(`${API_URL}/v1/rooms/?campus=${encodeURIComponent(query)}`).then(response => response.json());
