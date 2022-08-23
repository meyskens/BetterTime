import { Row, Col, Dropdown } from "react-bootstrap";
import { useEffect, useState, createRef } from "react";

import { MultiSelect } from "react-multi-select-component";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import resourceTimelinePlugin from "@fullcalendar/resource-timeline";
import resourceTimeGridPlugin from "@fullcalendar/resource-timegrid";
import listPlugin from "@fullcalendar/list";
import nlLocale from "@fullcalendar/core/locales/nl";
import momentPlugin from "@fullcalendar/moment";

import Calendar from "react-calendar";

import { getTimetableForID, getCampus, getRoomsForCampus } from "../../_services/roosterService";

const calViews = [{ name: "Tijdlijn", value: "resourceTimeline" }];

function Home() {
  const [timetable, setTimetable] = useState([]);

  const [selectedCampuses, setSelectedCampuses] = useState(JSON.parse(localStorage.getItem("selectedCampuses")) || []);
  const [selectedRooms, setSelectedRooms] = useState(JSON.parse(localStorage.getItem("selectedRooms")) || []);

  const [roomOptions, setRoomOptions] = useState([]);

  const [selectedDateInfo, setSelectedDateInfo] = useState(null);

  const [calView, setCalView] = useState(JSON.parse(localStorage.getItem("calViewRooms")) || calViews[0]);
  const calendarRef = createRef();

  const getMondayOfCurrentWeek = () => {
    const today = new Date();
    const first = today.getDate() - today.getDay() + 1;

    const monday = new Date(today.setDate(first));
    if (today.getDay() === 0) return new Date(today.setDate(first + 7)); // if sunday go to next week
    return monday;
  };

  const loadRoomOptions = async () => {
    const promises = selectedCampuses.map(campus => getRoomsForCampus(campus.value));
    const result = await Promise.all(promises);
    setRoomOptions(result.flat().map(room => ({ label: room.name, value: room.timeEditID })));
  };

  const loadData = async dateInfo => {
    const promises = selectedRooms.map(async col => {
      let start = selectedDateInfo ? selectedDateInfo.start : null;
      let end = selectedDateInfo ? selectedDateInfo.end : null;
      if (dateInfo) {
        start = dateInfo.start;
        end = dateInfo.end;
        setSelectedDateInfo(dateInfo);
      }
      const data = await getTimetableForID(col.value, start, end);
      data.map(d => {
        d.resourceId = col.value;
        d.source = col.label;
        return d;
      });
      return data;
    });
    const result = await Promise.all(promises);
    const events = [];
    result.map(res =>
      res.forEach(c => {
        console.log(c);
        events.push({
          title: c.ola,
          start: c.start,
          end: c.end,
          resourceId: c.resourceId,
          extendedProps: {
            campus: c.campus,
            room: c.room,
            classes: c.classes,
            source: c.source,
          },
        });
      }),
    );
    setTimetable(events);
  };

  useEffect(() => {
    loadRoomOptions();
  }, [selectedCampuses]);

  useEffect(() => {
    window.localStorage.setItem("selectedCampuses", JSON.stringify(selectedCampuses));
    window.localStorage.setItem("selectedRooms", JSON.stringify(selectedRooms));
    loadData();
  }, [selectedCampuses, selectedRooms]);

  useEffect(() => {
    window.localStorage.setItem("calViewRooms", JSON.stringify(calView));
    calendarRef.current.getApi().changeView(calView.value);
  }, [calView]);

  const renderEventContent = eventInfo => (
    <>
      <p>
        <b>
          {eventInfo.event.start.toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" })} -{" "}
          {eventInfo.event.end.toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" })}{" "}
        </b>
        <i>{eventInfo.event.title}</i> {eventInfo.event.extendedProps.classes.join(" ")}
      </p>
    </>
  );

  const pickDate = date => {
    calendarRef.current.getApi().gotoDate(date);
  };

  return (
    <>
      <Row>
        <Col>
          <h2>Lokalen</h2>
        </Col>
      </Row>
      <Row>
        <Col md={10}>
          <FullCalendar
            plugins={[dayGridPlugin, resourceTimelinePlugin, resourceTimeGridPlugin, momentPlugin, listPlugin]}
            initialView={calView.value}
            schedulerLicenseKey="GPL-My-Project-Is-Open-Source"
            events={timetable}
            firstDay={1}
            resources={selectedRooms.map(c => ({ id: c.value, title: c.label }))}
            scrollTime="08:15:00"
            allDaySlot={false}
            eventDisplay="block"
            datesSet={loadData}
            slotMinTime="08:00:00"
            themeSystem="bootstrap5"
            eventContent={renderEventContent}
            locale={nlLocale}
            titleFormat={{ day: "2-digit", month: "long", year: "numeric" }}
            dayHeaderFormat="ddd DD/MM"
            ref={calendarRef}
            initialDate={getMondayOfCurrentWeek()}
          />
        </Col>
        <Col md={2}>
          <Dropdown>
            <Dropdown.Toggle variant="primary" id="dropdown-basic">
              {calView.name}
            </Dropdown.Toggle>

            <Dropdown.Menu>
              {calViews.map(c => (
                <Dropdown.Item key={c.value} onClick={() => setCalView(c)}>
                  {c.name}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
          <Calendar onChange={pickDate} className="my-2" />
          <h3>Campus</h3>
          <MultiSelect options={getCampus()} value={selectedCampuses} onChange={setSelectedCampuses} hasSelectAll={false} labelledBy="Select" />

          <h3 className="mt-2">Lokalen</h3>
          <MultiSelect options={roomOptions} value={selectedRooms} onChange={setSelectedRooms} hasSelectAll={false} labelledBy="Select" />
        </Col>
      </Row>
    </>
  );
}

export default Home;
