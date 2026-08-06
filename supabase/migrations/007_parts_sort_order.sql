-- Custom, user-defined ordering of parts within a bike (drag-to-reorder).
-- Nullable: NULL means "no custom order yet" and the app falls back to the
-- default category ordering. Purely additive, no data loss.
alter table public.parts
  add column if not exists sort_order integer;

comment on column public.parts.sort_order is
  'User-defined display order within a bike (drag-to-reorder). NULL = default category order.';
