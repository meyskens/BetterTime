import { Row, Col } from "react-bootstrap";
import { useEffect, useState } from "react";

import { MultiSelect } from "react-multi-select-component";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import resourceTimelinePlugin from "@fullcalendar/resource-timeline";
import resourceTimeGridPlugin from "@fullcalendar/resource-timegrid";
import nlLocale from "@fullcalendar/core/locales/nl";
import momentPlugin from "@fullcalendar/moment";

import { getTimetableForID, getCollegas } from "../../_services/roosterService";

function Home() {
  const [timetable, setTimetable] = useState([]);
  const [selectedCollegas, setSelectedCollegas] = useState(JSON.parse(localStorage.getItem("selectedCollegas")) || []);
  const [selectedDateInfo, setSelectedDateInfo] = useState(null);

  const views = {
    resourceTimeGridSevenDay: {
      type: "resourceTimeGrid",
      duration: { days: 7 },
      buttonText: "Week",
    },
  };

  const loadData = async dateInfo => {
    const promises = selectedCollegas.map(async col => {
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
          },
        });
      }),
    );
    setTimetable(events);
  };

  useEffect(() => {
    window.localStorage.setItem("selectedCollegas", JSON.stringify(selectedCollegas));
    loadData();
  }, [selectedCollegas]);

  const renderEventContent = eventInfo => (
    <>
      <p>
        <b>{eventInfo.timeText}</b>
        <br />
        <i>{eventInfo.event.title}</i>
      </p>
      <p>
        <b>
          {eventInfo.event.extendedProps.campus}
          {eventInfo.event.extendedProps.campus && " "}
          {eventInfo.event.extendedProps.room}
        </b>
        <br />
        {eventInfo.event.extendedProps.classes.join(" ")}
      </p>
    </>
  );

  return (
    <>
      <Row>
        <Col>
          <h2>Rooster</h2>
        </Col>
      </Row>
      <Row>
        <Col md={10}>
          <FullCalendar
            plugins={[dayGridPlugin, resourceTimelinePlugin, resourceTimeGridPlugin, momentPlugin]}
            views={views}
            initialView="resourceTimeGridSevenDay"
            schedulerLicenseKey="GPL-My-Project-Is-Open-Source"
            events={timetable}
            firstDay={1}
            resources={selectedCollegas.map(c => ({ id: c.value, title: c.label }))}
            scrollTime="08:15:00"
            allDaySlot={false}
            eventDisplay="block"
            datesSet={loadData}
            slotMinTime="08:00:00"
            themeSystem="bootstrap5"
            eventContent={renderEventContent}
            locale={nlLocale}
            titleFormat={{ day: "2-digit", month: "long", year: "numeric" }}
            dayHeaderFormat="DD/MM"
          />
        </Col>
        <Col md={2}>
          <h3>Collega&#39;s</h3>
          <MultiSelect options={getCollegas()} value={selectedCollegas} onChange={setSelectedCollegas} labelledBy="Select" />

          <h3>Klassen</h3>
        </Col>
      </Row>
    </>
  );
}

export default Home;
