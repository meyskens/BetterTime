package v1

import (
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
)

func init() {
	registers = append(registers, func(e *echo.Echo, h *HTTPHandler) {
		e.GET("/v1/timetable/:id", h.getTimeTable)
		e.GET("/v1/classes/search", h.searchClasses)
		e.GET("/v1/rooms/", h.getRooms)
	})
}

func (h *HTTPHandler) getTimeTable(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "id is required"})
	}
	from := time.Now().Truncate(24 * time.Hour)
	to := from.Add(30 * 24 * time.Hour).Truncate(24 * time.Hour)

	if c.QueryParam("from") != "" {
		fromT, err := time.Parse("2006-01-02", c.QueryParam("from"))
		if err != nil {
			return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid from date"})
		}
		from = fromT
	}
	if c.QueryParam("to") != "" {
		toT, err := time.Parse("2006-01-02", c.QueryParam("to"))
		if err != nil {
			return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid to date"})
		}
		to = toT
	}

	timetable, err := h.api.GetTimeTableForID(id, from, to)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, timetable)
}

func (h *HTTPHandler) searchClasses(c echo.Context) error {
	query := c.QueryParam("query")
	if query == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "query is required"})
	}
	classes, err := h.api.GetClassesForQuery(query)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, classes)
}

func (h *HTTPHandler) getRooms(c echo.Context) error {
	query := c.QueryParam("campus")
	if query == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "campus is required"})
	}
	rooms, err := h.api.GetRoomsForCampus(query)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, rooms)
}
