import { API_URL } from "../Config";

// this exporter is only used if you need to have raw fetch() access!
// otherwise you can use the default exporter

export const getApiURL = () => API_URL;

export const getTimetableForID = (id, from, to) =>
  fetch(
    `${API_URL}/v1/timetable/${id}?from=${from ? new Date(from).toLocaleDateString("se-SE") : ""}&to=${to ? new Date(to).toLocaleDateString("se-SE") : ""}`,
  ).then(response => response.json());
