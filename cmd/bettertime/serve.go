package main

import (
	"context"
	"fmt"

	"os"
	"os/signal"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	v1 "github.com/meyskens/BetterTime/pkg/api/v1"
	"github.com/spf13/cobra"
)

func init() {
	rootCmd.AddCommand(NewServeCmd())
}

type serveCmdOptions struct {
	BindAddr string
	Port     int

	baseURL string
}

// NewServeCmd generates the `serve` command
func NewServeCmd() *cobra.Command {
	s := serveCmdOptions{}
	c := &cobra.Command{
		Use:     "serve",
		Short:   "Serves the HTTP REST endpoint",
		Long:    `Serves the HTTP REST endpoint on the given bind address and port`,
		PreRunE: s.Validate,
		RunE:    s.RunE,
	}
	c.Flags().StringVarP(&s.BindAddr, "bind-address", "b", "0.0.0.0", "address to bind port to")
	c.Flags().IntVarP(&s.Port, "port", "p", 8080, "Port to listen on")

	c.Flags().StringVarP(&s.baseURL, "base-url", "u", "", "Base URL to use for the TimeEdit instance")

	c.MarkFlagRequired("base-url")
	return c
}

func (s *serveCmdOptions) Validate(cmd *cobra.Command, args []string) error {
	return nil
}

func (s *serveCmdOptions) RunE(cmd *cobra.Command, args []string) error {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	e := echo.New()
	e.HideBanner = true
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORS())

	// rewrite paths that frontend uses
	e.Use(func(h echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			if c.Request().URL.Path == "/rooms" {
				c.Request().URL.Path = "/"
			}
			return h(c)
		}

	// serve Swagger as static content
	e.Static("/", "static")


	// register the HTTP handlers
	v1.NewHTTPHandler(s.baseURL).Register(e)

	go func() {
		e.Start(fmt.Sprintf("%s:%d", s.BindAddr, s.Port))
		cancel() // server ended, stop the world
	}()

	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt)
	for {
		select {
		case <-c:
			cancel()
		case <-ctx.Done():
			return nil
		}
	}
}
