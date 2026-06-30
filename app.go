package main

import (
	"context"

	"codex-history-manager/internal/discovery"
	"codex-history-manager/internal/planning"
)

type App struct {
	ctx       context.Context
	discovery *discovery.Service
	planning  *planning.Service
}

func NewApp() *App {
	return &App{
		discovery: discovery.NewService(),
		planning:  planning.NewService(),
	}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}
