package main

import (
	"context"

	"codex-history-manager/internal/discovery"
)

type App struct {
	ctx       context.Context
	discovery *discovery.Service
}

func NewApp() *App {
	return &App{discovery: discovery.NewService()}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}
