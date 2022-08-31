import { Row, Col, Dropdown, Button, OverlayTrigger, Popover, Form, InputGroup, Alert } from "react-bootstrap";
import { useEffect, useState, createRef } from "react";

import { MultiSelect } from "react-multi-select-component";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import resourceTimelinePlugin from "@fullcalendar/resource-timeline";
import resourceTimeGridPlugin from "@fullcalendar/resource-timegrid";
import listPlugin from "@fullcalendar/list";
import nlLocale from "@fullcalendar/core/locales/nl";
import momentPlugin from "@fullcalendar/moment";

import { getTimetableForID, getCollegas, getClassesForQuery } from "../../_services/roosterService";
import { CLASS_SEARCH, API_URL } from "../../Config";
import toastService from "../../_services/toastService";

const calViews = [
  { name: "Week", value: "resourceTimeGridSevenDay" },
  { name: "Week (parallel)", value: "weekParallel" },
  { name: "Maand", value: "dayGridMonth" },
  { name: "Lijst", value: "listWeek" },
];

function Home() {
  const [timetable, setTimetable] = useState([]);
  const [selectedCollegas, setSelectedCollegas] = useState(JSON.parse(localStorage.getItem("selectedCollegas")) || []);
  const [selectedDateInfo, setSelectedDateInfo] = useState(null);

  const [classOptions, setClassOptions] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState(JSON.parse(localStorage.getItem("selectedClasses")) || []);

  const [calView, setCalView] = useState(JSON.parse(localStorage.getItem("calView")) || calViews[0]);
  const calendarRef = createRef();

  const views = {
    resourceTimeGridSevenDay: {
      type: "resourceTimeGrid",
      duration: { days: 7 },
      buttonText: "Week",
      datesAboveResources: selectedClasses.length + selectedCollegas.length > 1,
      nowIndicator: true,
      dateAlignment: "week",
    },
    weekParallel: {
      type: "timeGridWeek",
      duration: { days: 7 },
      buttonText: "Week",
      nowIndicator: true,
      dateAlignment: "week",
    },
  };

  const getMondayOfCurrentWeek = () => {
    const today = new Date();
    const first = today.getDate() - today.getDay() + 1;

    const monday = new Date(today.setDate(first));
    if (today.getDay() === 0) return new Date(today.setDate(first + 7)); // if sunday go to next week
    return monday;
  };

  const loadClassOptions = async () => {
    const promises = CLASS_SEARCH.split(",").map(classSearch => getClassesForQuery(classSearch.trim()));
    const result = await Promise.all(promises);
    setClassOptions(
      result
        .flat()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(c => ({ value: c.timeEditID, label: c.name }))
        .filter((c, i, arr) => arr.findIndex(d => d.label === c.label) === i),
    );
  };

  const loadData = async dateInfo => {
    const promises = selectedCollegas.concat(selectedClasses).map(async col => {
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
            extraInfo: c.extraInfo,
          },
        });
      }),
    );
    setTimetable(events);
  };

  useEffect(() => {
    window.localStorage.setItem("selectedCollegas", JSON.stringify(selectedCollegas));
    window.localStorage.setItem("selectedClasses", JSON.stringify(selectedClasses));
    loadData();
  }, [selectedCollegas, selectedClasses]);

  useEffect(() => {
    window.localStorage.setItem("calView", JSON.stringify(calView));
    calendarRef.current.getApi().changeView(calView.value);
  }, [calView]);

  useEffect(() => {
    loadClassOptions();
  }, []);

  const renderEventContent = eventInfo => (
    <>
      <p>
        <b>{eventInfo.timeText}</b>
        <br />
        <i>{eventInfo.event.title}</i>
        {calView.value !== "resourceTimeGridSevenDay" ? (
          <>
            <br />
            {eventInfo.event.extendedProps.source}
          </>
        ) : (
          ""
        )}
        <br />
        <b>
          {eventInfo.event.extendedProps.campus}
          {eventInfo.event.extendedProps.campus && " "}
          {eventInfo.event.extendedProps.room}
        </b>
        {eventInfo.event.extendedProps.classes.length > 0 && <br />}
        {eventInfo.event.extendedProps.classes.join(" ")}
        {eventInfo.event.extendedProps.extraInfo && <br />}
        {eventInfo.event.extendedProps.extraInfo}
      </p>
    </>
  );

  const exportPopover = () => {
    const url = `${API_URL}/v1/ical/?id=${selectedCollegas
      .concat(selectedClasses)
      .map(l => l.value)
      .join(",")
      .trim(",")}`;
    const copyUrl = () => {
      navigator.clipboard.writeText(url);
      toastService.send({ title: "Success", message: "URL gekopieerd naar klembord" });
    };
    return (
      <Popover>
        <Popover.Header as="h3">Exporteer</Popover.Header>
        <Popover.Body>
          <p>Je kan deze rooster gebruiken in Outlook, Google Calendar of bijna elke andere software. Kopieer onderstaande URL en voeg deze als webkalender.</p>
          <InputGroup>
            <Form.Control aria-label="ical url" onClick={copyUrl} disabled value={url} />
            <InputGroup.Text id="basic-addon2" onClick={copyUrl}>
              <i className="fa-solid fa-copy" />
            </InputGroup.Text>
          </InputGroup>
          <p className="text-muted text-small">(deze gaat tot 240 dagen verder en 14 dagen terug, in tegenstelling tot de 30 in TE)</p>
        </Popover.Body>
      </Popover>
    );
  };

  return (
    <>
      <Row>
        <Col>
          <h2>Rooster</h2>
        </Col>
      </Row>
      <Row>
        <Alert variant="warning">
          Door aanhoudende problemen bij de KUL TimeEdit kan de informatie tijdelijk niet beschikbaar zijn. BetterTime is niet verantwoordelijk voor deze
          problemen.
        </Alert>
      </Row>
      <Row>
        <Col md={10} className="order-2 order-md-1">
          <FullCalendar
            plugins={[dayGridPlugin, resourceTimelinePlugin, resourceTimeGridPlugin, momentPlugin, listPlugin]}
            views={views}
            initialView={calView.value}
            schedulerLicenseKey="GPL-My-Project-Is-Open-Source"
            events={timetable}
            firstDay={1}
            resources={selectedCollegas.concat(selectedClasses).map(c => ({ id: c.value, title: c.label }))}
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
        <Col md={2} className="order-1 order-md-2 mb-3 mb-md-0">
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
          <h3>Collega&#39;s</h3>
          <MultiSelect options={getCollegas()} value={selectedCollegas} onChange={setSelectedCollegas} hasSelectAll={false} labelledBy="Select" />

          <h3 className="mt-2">Klassen</h3>
          <MultiSelect options={classOptions} value={selectedClasses} onChange={setSelectedClasses} hasSelectAll={false} labelledBy="Select" />

          {selectedClasses.concat(selectedCollegas).length > 0 && (
            <OverlayTrigger trigger="click" placement="bottom" overlay={exportPopover()}>
              <Button variant="secondary" className="mt-5">
                <i className="fas fa-file-export" /> Export
              </Button>
            </OverlayTrigger>
          )}
        </Col>
      </Row>
    </>
  );
}

export default Home;
