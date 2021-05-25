import { render, resolveInclude } from "ejs";
import express from "express";
import pg from "pg";

// Initialise the DB connection
const { Pool } = pg;
const pgConnectionConfigs = {
  user: "yiqing",
  host: "localhost",
  database: "birding",
  port: 5432, // Postgres server always runs on this port by default
};
const pool = new Pool(pgConnectionConfigs);
const speciesId = {};

const app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  const whenDoneWithQuery = (error, result) => {
    if (error) {
      console.log("Error executing query", error.stack);
      response.status(503).send(result.rows);
    } else {
      const data = { records: result.rows };
      console.log(data);
      res.render("root", data);
    }
  };
  const sqlQuery = "SELECT * FROM records";
  pool.query(sqlQuery, whenDoneWithQuery);
});
app.get("/notes", (req, res) => {
  pool.query(`SELECT * FROM species`, (err, result) => {
    if (err) {
      return console.log("error", err);
    }
    result.rows.forEach((x) => {
      speciesId[x.scientific_name] = x.id;
    });
  });
  console.log(speciesId);
  let behaviourArr;
  pool.query(`SELECT * FROM behaviours`, (err, result) => {
    if (err) {
      return console.log("error", err);
    }
    behaviourArr = result.rows;
    console.log(behaviourArr);
    res.render("noteForm", { species: speciesId, behaviour: behaviourArr });
  });
});
app.get("/notes/:id", (req, res) => {
  pool.query(
    `SELECT records.name,records.date,records.weather,records.appearance,comments.comment FROM records INNER JOIN comments ON records.id=comments.record_id WHERE records.id=${Number(
      req.params.id
    )}`,
    (err, result) => {
      if (err) {
        return console.log(err);
      }
      console.log(result.rows, "result");
      res.render("indivNote", { record: result.rows, index: req.params.id });
    }
  );
});
app.post("/note", (req, res) => {
  console.log(req.body.behaviour_id);
  pool.query(
    "INSERT INTO records (name,date,weather,appearance) VALUES ($1,$2,$3,$4)",
    [req.body.birdName, req.body.date, req.body.weather, req.body.appearance],
    (error, result) => {
      if (error) {
        console.log("error", error);
      } else {
        res.redirect("/");
      }
    }
  );
});
app.get("/notes/:index/comment", (req, res) => {
  pool.query(
    `SELECT * FROM records WHERE id = ${req.params.index}`,
    (err, result) => {
      if (err) {
        return console.log("error", err);
      }
      res.render("comment", {
        index: req.params.index,
        record: result.rows[0],
      });
    }
  );
});
app.post("/notes/:index/comment", (req, res) => {
  console.log("comment", req.body.comment);
  pool.query(
    `INSERT INTO comments (record_id,comment) VALUES ($1,$2)`,
    [req.params.index, req.body.comment],
    (err, result) => {
      if (err) {
        return console.log(err);
      }
      console.log("done");
      res.redirect(`/notes/${req.params.index}`);
    }
  );
});
app.get("/signup", (req, res) => {
  res.render("signUpForm", {});
});
app.post("/signup", (req, res) => {
  pool.query(
    "INSERT INTO users (email,password) VALUES ($1,$2)",
    [req.body.email, req.body.password],
    (err, result) => {
      if (err) {
        console.log("error", err);
      }
      res.render("confirmation", { message: "Congrats You Have Signed Up" });
    }
  );
});
app.get("/login", (req, res) => {
  res.render("login", {});
});
app.post("/login", (req, res) => {
  pool.query(
    `SELECT * FROM users WHERE email='${req.body.email}' AND password='${req.body.password}'`,
    (err, result) => {
      if (err) {
        console.log("error", err);
      } else {
        if (result.rows[0]) {
          res.cookie("userId", req.body.email);
          res.redirect("/");
        } else {
          res.render("confirmation", {
            message: "Your login details are invalid",
          });
        }
      }
    }
  );
});
app.post("/logout", (req, res) => {
  res.clearCookie("userId");
  res.redirect("/");
});

//POCE:7
app.get("/species", (req, res) => {
  res.render("speciesForm", {
    edit: false,
    species: { species_name: "", scientific_name: "" },
  });
});
app.post("/species", (req, res) => {
  pool.query(
    "INSERT INTO species (species_name,scientific_name) VALUES ($1, $2) RETURNING *",
    [req.body.speciesName, req.body.scientific_name],
    (err, results) => {
      if (err) {
        console.log("error", err);
        return;
      }
      speciesId[results.rows[0].scientific_name] = results.rows[0].id;
      console.log(speciesId);
    }
  );
  res.redirect("/");
});
app.get("/species/:index");
app.get("/species/all");
app.get("/species/:index/edit", (req, res) => {});
app.put("/species/:index/edit");
app.delete("/species/:index/delete");
app.listen(3004);
