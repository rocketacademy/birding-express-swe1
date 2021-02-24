CREATE TABLE behaviour (
  id SERIAL PRIMARY KEY,
  action TEXT
);

CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  text TEXT,
  notes_id INTEGER REFERENCES notes(id),
  user_id INTEGER REFERENCES users(id)
);

CREATE TABLE notes (
  id SERIAL PRIMARY KEY,
  flock_size INTEGER,
  user_id INTEGER REFERENCES users(id),
  species_id INTEGER REFERENCES species(id),
  date TEXT,
  behaviour TEXT
);

CREATE TABLE species (
  id SERIAL PRIMARY KEY,
  name TEXT,
  scientific_name TEXT,
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT,
  password TEXT,
);

CREATE TABLE notes_behaviour (
  id SERIAL PRIMARY KEY,
  notes_id INTEGER REFERENCES notes(id),
  behaviour_id INTEGER REFERENCES behaviour(id)
);




INSERT INTO users (email, password) VALUES (test123@gmail.com, 0dd3e512642c97ca3f747f9a76e374fbda73f9292823c0313be9d78add7cdd8f72235af0c553dd26797e78e1854edee0ae002f8aba074b066dfce1af114e32f8);

INSERT INTO behaviour (action) VALUES ('bathing'), ('feeding'), ('walking'), ('resting'), ('flocking'), ('preening');   
  
INSERT INTO species (name, scientific_name) VALUES ('Wandering Whistling Duckling Duck', 'Dendrocygna arcuata'), ('Lesser Whistling Duck', 'Dendrocygna javanica'), ('Cotton Pygmy Goose', 'ettapus coromandelianus'), ('Gadwall', 'Anas strepera'), ('Eurasian Wigeon', 'Anas penelope'), ('Northern Shoveler','Anas clypeata'), ('Northern Pintail', 'Anas acuta'), ('Garganey', 'Anas querquedula'), ('Eurasian Teal', 'Anas crecca'), ('Tufted Duck', 'Aythya fuligula'), ('Red Junglefowl', 'Gallus gallus');            