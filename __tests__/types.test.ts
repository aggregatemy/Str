import { describe, it, expectTypeOf } from 'vitest';
import type { LegalUpdate, IngestMethod, UserProfileType, SystemConfig, MonitoredSite, DashboardStats } from '../types';

describe('Type Definitions', () => {
  it('LegalUpdate powinien mieć wszystkie wymagane pola', () => {
    expectTypeOf<LegalUpdate>().toHaveProperty('id');
    expectTypeOf<LegalUpdate>().toHaveProperty('title');
    expectTypeOf<LegalUpdate>().toHaveProperty('date');
    expectTypeOf<LegalUpdate>().toHaveProperty('impact');
    expectTypeOf<LegalUpdate>().toHaveProperty('ingestMethod');
    expectTypeOf<LegalUpdate>().toHaveProperty('category');
    expectTypeOf<LegalUpdate>().toHaveProperty('summary');
    expectTypeOf<LegalUpdate>().toHaveProperty('legalStatus');
    expectTypeOf<LegalUpdate>().toHaveProperty('officialRationale');
  });

  it('IngestMethod powinien być union type', () => {
    expectTypeOf<IngestMethod>().toEqualTypeOf<'eli' | 'rss' | 'scraper'>();
  });

  it('Impact powinien być union type', () => {
    type Impact = LegalUpdate['impact'];
    expectTypeOf<Impact>().toEqualTypeOf<'low' | 'medium' | 'high'>();
  });

  it('UserProfileType powinien być prawidłowy', () => {
    expectTypeOf<UserProfileType>().toEqualTypeOf<'director' | 'legal' | 'staff' | 'dev'>();
  });

  it('SystemConfig powinien mieć wymagane pola', () => {
    expectTypeOf<SystemConfig>().toHaveProperty('masterSites');
    expectTypeOf<SystemConfig>().toHaveProperty('strategicTopics');
  });

  it('MonitoredSite powinien mieć właściwą strukturę', () => {
    expectTypeOf<MonitoredSite>().toHaveProperty('id');
    expectTypeOf<MonitoredSite>().toHaveProperty('url');
    expectTypeOf<MonitoredSite>().toHaveProperty('name');
    expectTypeOf<MonitoredSite>().toHaveProperty('isActive');
    expectTypeOf<MonitoredSite>().toHaveProperty('type');
  });

  it('MonitoredSite type powinien być IngestMethod', () => {
    type SiteType = MonitoredSite['type'];
    expectTypeOf<SiteType>().toEqualTypeOf<IngestMethod>();
  });

  it('DashboardStats powinien mieć właściwą strukturę', () => {
    expectTypeOf<DashboardStats>().toHaveProperty('total');
    expectTypeOf<DashboardStats>().toHaveProperty('highImpact');
    expectTypeOf<DashboardStats>().toHaveProperty('mediumImpact');
    expectTypeOf<DashboardStats>().toHaveProperty('lowImpact');
  });

  it('DashboardStats wszystkie pola powinny być liczbami', () => {
    expectTypeOf<DashboardStats['total']>().toBeNumber();
    expectTypeOf<DashboardStats['highImpact']>().toBeNumber();
    expectTypeOf<DashboardStats['mediumImpact']>().toBeNumber();
    expectTypeOf<DashboardStats['lowImpact']>().toBeNumber();
  });

  it('LegalUpdate opcjonalne pola', () => {
    expectTypeOf<LegalUpdate['eliUri']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<LegalUpdate['sourceUrl']>().toEqualTypeOf<string | undefined>();
  });

  it('SystemConfig masterSites jest tablicą MonitoredSite', () => {
    expectTypeOf<SystemConfig['masterSites']>().toEqualTypeOf<MonitoredSite[]>();
  });

  it('SystemConfig strategicTopics jest tablicą stringów', () => {
    expectTypeOf<SystemConfig['strategicTopics']>().toEqualTypeOf<string[]>();
  });
});
