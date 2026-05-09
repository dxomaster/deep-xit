-- Add field to track when images are being generated
alter table rooms
add column is_generating_images boolean not null default false;
