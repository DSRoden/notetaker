create table messages(
  id serial primary key,
  content varchar(200) not null,
  created_at timestamp not null default now(),
  user_id integer not null references users(id),
  day_id integer not null references days(id),
  likes integer DEFAULT 0
);
