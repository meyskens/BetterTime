package v1

import (
	"github.com/labstack/echo/v4"
	"github.com/meyskens/BetterTime/pkg/timeedit"
)

var registers []func(e *echo.Echo, h *HTTPHandler)

type HTTPHandler struct {
	api *timeedit.TimeEditAPI
}

func NewHTTPHandler(baseURL string) *HTTPHandler {
	return &HTTPHandler{
		api: timeedit.NewTimeEditAPI(baseURL),
	}
}

func (h *HTTPHandler) Register(e *echo.Echo) {
	for _, regFn := range registers {
		regFn(e, h)
	}
}
