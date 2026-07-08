CREATE INDEX "capabilities_sort_idx" ON "capabilities" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "experiences_sort_idx" ON "experiences" USING btree ("started_at");