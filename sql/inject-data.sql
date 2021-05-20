INSERT INTO users (email, password, username) VALUES ('porter@gmail.com', 'd404559f602eab6fd602ac7680dacbfaadd13630335e951f097af3900e9de176b6db28512f2e000b9d04fba5133e8b1c6e8df59db3a8ab9d60be4b97cc9e81db', 'porter');
INSERT INTO users (email, password, username) VALUES ('user2@gmail.com', 'd404559f602eab6fd602ac7680dacbfaadd13630335e951f097af3900e9de176b6db28512f2e000b9d04fba5133e8b1c6e8df59db3a8ab9d60be4b97cc9e81db', 'user two');
INSERT INTO users (email, password, username) VALUES ('user3@gmail.com', 'd404559f602eab6fd602ac7680dacbfaadd13630335e951f097af3900e9de176b6db28512f2e000b9d04fba5133e8b1c6e8df59db3a8ab9d60be4b97cc9e81db', 'user three');

INSERT INTO notes (date_of_sighting, appearance, behaviour, flock_size, user_id) VALUES ('2021-02-10', 'looking good', 'doing nothing', '1', 1);
INSERT INTO notes (date_of_sighting, appearance, behaviour, flock_size, user_id) VALUES ('2021-03-10', 'flock of red and white birds', 'jumping around', '>10', 2);
INSERT INTO notes (date_of_sighting, appearance, behaviour, flock_size, user_id) VALUES ('2021-04-10', 'green', 'taking a shit', '1', 3);
INSERT INTO notes (date_of_sighting, appearance, behaviour, flock_size, user_id) VALUES ('2021-04-15', 'orange', 'flying in circles', '1-5', 1);
INSERT INTO notes (date_of_sighting, appearance, behaviour, flock_size, user_id) VALUES ('2021-05-20', 'black', 'falling', '1-5', 1);


-- command to run this file: psql -f <PATH_TO_FILE> OR \i <PATH_TO_FILE>
-- \i /home/eddiejpot/rocket-academy/bootcamp/projects/course-projects/bird-watching/sql/inject-data.sql