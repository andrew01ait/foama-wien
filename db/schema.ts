import {sqliteTable,text,integer,index} from 'drizzle-orm/sqlite-core';
export const transfers=sqliteTable('foama_transfers',{
 id:text('id').primaryKey(),readHash:text('read_hash').notNull(),writeHash:text('write_hash').notNull(),
 expires:integer('expires').notNull(),state:text('state').notNull().default('waiting'),
 direction:text('direction').notNull(),payload:text('payload'),capabilities:text('capabilities')
},t=>[index('foama_transfers_expires_idx').on(t.expires)]);
export const pushSubscriptions=sqliteTable('foama_push_subscriptions',{
 id:text('id').primaryKey(),authHash:text('auth_hash').notNull(),endpointHash:text('endpoint_hash').notNull().unique(),
 sealed:text('sealed').notNull(),expires:integer('expires').notNull(),lastSent:integer('last_sent').notNull().default(0),
 lastTest:integer('last_test').notNull().default(0),day:text('day').notNull().default(''),dayCount:integer('day_count').notNull().default(0),
 retryAfter:integer('retry_after').notNull().default(0)
},t=>[index('foama_push_expires_idx').on(t.expires)]);
export const pushDeliveries=sqliteTable('foama_push_deliveries',{
 id:text('id').primaryKey(),subscriptionId:text('subscription_id').notNull().references(()=>pushSubscriptions.id,{onDelete:'cascade'}),created:integer('created').notNull()
},t=>[index('foama_push_delivery_sub_idx').on(t.subscriptionId)]);
export const pushRuntime=sqliteTable('foama_push_runtime',{
 id:text('id').primaryKey(),lastCheck:integer('last_check').notNull().default(0),lastSuccess:integer('last_success').notNull().default(0),
 nextAllowed:integer('next_allowed').notNull().default(0),leaseUntil:integer('lease_until').notNull().default(0),leaseToken:text('lease_token').notNull().default(''),
 cursor:text('cursor').notNull().default(''),status:text('status').notNull().default('idle'),result:text('result').notNull().default('{}')
});
// Public operator facts only; never associate checks with devices, GPS or users.
export const stationLineConfirmations=sqliteTable('foama_station_lines',{
 id:text('id').primaryKey(),stationId:text('station_id').notNull(),route:text('route').notNull(),mode:text('mode').notNull(),
 firstSeen:integer('first_seen').notNull(),lastSeen:integer('last_seen').notNull()
},t=>[index('foama_station_lines_station_idx').on(t.stationId),index('foama_station_lines_seen_idx').on(t.lastSeen)]);
export const stationCheckDays=sqliteTable('foama_station_check_days',{
 id:text('id').primaryKey(),stationId:text('station_id').notNull(),day:text('day').notNull(),band:integer('band').notNull(),
 firstChecked:integer('first_checked').notNull(),lastChecked:integer('last_checked').notNull()
},t=>[index('foama_station_check_station_idx').on(t.stationId),index('foama_station_check_time_idx').on(t.lastChecked)]);
// Bounded aggregate service usage only; never store search inputs or identity.
export const journeyBudget=sqliteTable('foama_journey_budget',{
 id:text('id').primaryKey(),kind:text('kind').notNull(),hour:integer('hour').notNull(),count:integer('count').notNull()
});
