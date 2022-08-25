package v1

import (
	"net/http"
	"strings"
	"time"

	ics "github.com/arran4/golang-ical"
	"github.com/labstack/echo/v4"
	"github.com/meyskens/BetterTime/pkg/timeedit"
)

func init() {
	registers = append(registers, func(e *echo.Echo, h *HTTPHandler) {
		e.GET("/v1/ical/", h.getIcal)
	})
}

func (h *HTTPHandler) getIcal(c echo.Context) error {
	idsString := c.QueryParam("id")
	if idsString == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "id is required"})
	}

	ids := strings.Split(idsString, ",")
	events := []timeedit.Event{}

	for _, id := range ids {
		e, err := h.api.GetTimeTableForID(id, time.Now().Add(-14*time.Hour), time.Now().Add(180*24*time.Hour))
		if err != nil {
			return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		}
		events = append(events, e...)
	}

	cal := ics.NewCalendar()
	cal.SetMethod(ics.MethodRequest)

	for _, e := range events {
		ic := cal.AddEvent(e.TimeEditID)
		ic.SetSummary(e.OLA)
		ic.SetDescription(strings.Join(e.Classes, " "))
		loc := e.Campus
		if loc != "" {
			loc += " "
		}
		loc += e.Room
		ic.SetLocation(loc)
		ic.SetStartAt(e.Start)
		ic.SetEndAt(e.End)

	}

	return c.Blob(http.StatusOK, "text/calendar", []byte(cal.Serialize()))
}
