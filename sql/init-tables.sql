CREATE TABLE notes (
  id SERIAL PRIMARY KEY,
  date_of_sighting DATE,
  appearance TEXT,
  behaviour TEXT,
  flock_size TEXT
);

-- command to run this file: psql -f <PATH_TO_FILE> OR \i <PATH_TO_FILE>
-- \i /home/eddiejpot/rocket-academy/bootcamp/projects/course-projects/bird-watching/sql/init-tables.sql