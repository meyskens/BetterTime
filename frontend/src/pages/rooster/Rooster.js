import { Row, Col } from "react-bootstrap";
import { useState } from "react";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import resourceTimelinePlugin from "@fullcalendar/resource-timeline";
import resourceTimeGridPlugin from "@fullcalendar/resource-timegrid";
import nlLocale from "@fullcalendar/core/locales/nl";
import momentPlugin from "@fullcalendar/moment";

import { getTimetableForID } from "../../_services/roosterService";

function Home() {
  const [timetable, setTimetable] = useState([]);
  const [selectedCollegas] = useState(["244877.3"]); // select Maartje Eyskens
  const [calResources] = useState([{ id: "244877.3", title: "Maartje Eyskens" }]);

  const views = {
    resourceTimeGridSevenDay: {
      type: "resourceTimeGrid",
      duration: { days: 7 },
      buttonText: "Week",
    },
  };

  const loadData = async dateInfo => {
    const promises = selectedCollegas.map(async id => {
      let start = null;
      let end = null;
      if (dateInfo) {
        start = dateInfo.start;
        end = dateInfo.end;
      }
      const data = await getTimetableForID(id, start, end);
      data.map(d => {
        d.resourceId = id;
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
            resources={calResources}
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

          <h3>Klassen</h3>
        </Col>
      </Row>
    </>
  );
}

export default Home;
