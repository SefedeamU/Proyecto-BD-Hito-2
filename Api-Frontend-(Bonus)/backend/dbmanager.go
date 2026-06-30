package main

import (
	"context"
	"fmt"
	"sync"

	"github.com/jackc/pgx/v5/pgxpool"
)

// DBManager mantiene un pool de conexiones por base de datos (lazy: el pool se
// crea la primera vez que se usa). Solo permite las bases del allowlist, de
// modo que el frontend puede elegir a cuál enrutar sin riesgo de conectar a
// bases arbitrarias.
type DBManager struct {
	mu    sync.Mutex
	pools map[string]*pgxpool.Pool
	allow map[string]bool
	order []string
	def   string
}

func NewDBManager(names []string, def string) *DBManager {
	m := &DBManager{pools: map[string]*pgxpool.Pool{}, allow: map[string]bool{}, order: names, def: def}
	for _, n := range names {
		if n != "" {
			m.allow[n] = true
		}
	}
	return m
}

func (m *DBManager) Allowed(name string) bool { return m.allow[name] }
func (m *DBManager) Default() string          { return m.def }
func (m *DBManager) Names() []string          { return m.order }

// Pool devuelve (creando si hace falta) el pool de la base pedida.
func (m *DBManager) Pool(name string) (*pgxpool.Pool, error) {
	if !m.allow[name] {
		return nil, fmt.Errorf("base de datos no permitida: %s", name)
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	if p, ok := m.pools[name]; ok {
		return p, nil
	}
	cfg, err := pgxpool.ParseConfig(buildDSN(name))
	if err != nil {
		return nil, err
	}
	cfg.MaxConns = 6
	p, err := pgxpool.NewWithConfig(context.Background(), cfg)
	if err != nil {
		return nil, err
	}
	m.pools[name] = p
	return p, nil
}

func (m *DBManager) Close() {
	m.mu.Lock()
	defer m.mu.Unlock()
	for _, p := range m.pools {
		p.Close()
	}
}
