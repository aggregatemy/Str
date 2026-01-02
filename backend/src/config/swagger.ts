import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Strażnik Prawa API',
      version: '1.0.0',
      description: `
## Backend API dla systemu monitoringu aktów prawnych

Strażnik Prawa to system zero-AI dla faktograficznej ingestii aktów prawnych z oficjalnych źródeł państwowych.

### Źródła danych:
- **ELI (European Legislation Identifier)**: 12 serwerów
  - Klient A (JSON): Sejm RP - Dziennik Ustaw (DU), Monitor Polski (MP)
  - Klient B (XML): 10 ministerstw (MZ, MSWiA, MEN, MON, MKiDN, Klimat, UPRP, GUS, PGR, NBP)
- **RSS**: ZUS Aktualności, CEZ e-Zdrowie
- **Scrapers**: NFZ Zarządzenia Prezesa

### Harmonogram:
- **Scheduler**: Co 1 minutę (serwer europejski)
- **Zakres historyczny**: Grudzień 2025 + Styczeń 2026

### Architektura:
- **Persistence**: SQLite (dev.db, izolowane środowisko)
- **Porty**: Backend 5554, Frontend 5555
- **Rate limiting**: 100ms (Sejm), 150ms (Ministerstwa)
      `,
      contact: {
        name: 'Strażnik Prawa API Support'
      }
    },
    servers: [
      {
        url: 'http://localhost:5554',
        description: 'Development server (port 5554 - izolowane środowisko)'
      }
    ],
    tags: [
      {
        name: 'Health',
        description: 'System health monitoring'
      },
      {
        name: 'Updates',
        description: 'Legal facts retrieval'
      },
      {
        name: 'Export',
        description: 'Report generation'
      }
    ]
  },
  apis: ['./src/routes/*.ts'] // Ścieżka do plików z JSDoc annotations
};

export const swaggerSpec = swaggerJsdoc(options);
