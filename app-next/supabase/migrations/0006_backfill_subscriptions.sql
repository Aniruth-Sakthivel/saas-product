-- HotelOS — Phase 3: backfill trial subscriptions for organizations created
-- before subscription provisioning existed. Idempotent (subscriptions.org is
-- unique; we only insert where one is missing).

insert into subscriptions (organization_id, plan_id, status, interval, trial_ends_at, current_period_end)
select
  o.id,
  (select id from plans where code = 'pro'),
  'TRIALING'::subscription_status,
  'MONTHLY'::billing_interval,
  now() + interval '14 days',
  now() + interval '14 days'
from organizations o
where not exists (
  select 1 from subscriptions s where s.organization_id = o.id
);
