const con = require('./connection');


con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
    var sql = "INSERT INTO workouts (excer, reps, sets) VALUES ('bench press', '8', '3' )";
    con.query(sql, function (err, result) {
      if (err) throw err;
      console.log("1 record inserted");
    });
  });