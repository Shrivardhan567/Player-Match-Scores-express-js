const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
module.exports = app;

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

app.get("/players/", async (request, response) => {
  const listOfPlayersQuery = `
    SELECT 
    player_id AS playerId ,
    player_name AS playerName 
    FROM player_details ;`;
  const listOfPlayers = await db.all(listOfPlayersQuery);
  response.send(listOfPlayers);
});

app.get("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const detailsOfPlayerQuery = `
    SELECT
    player_id AS playerId ,
    player_name AS playerName 
    FROM player_details 
    WHERE player_id = ${playerId} ; `;
  const detailsOfPlayer = await db.get(detailsOfPlayerQuery);
  response.send(detailsOfPlayer);
});

app.put("/players/:playerId/", async (request, response) => {
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const { playerId } = request.params;
  const updatePlayerDetailsQuery = `
    UPDATE 
    player_details
    SET 
    player_name = '${playerName}' 
    where player_id = ${playerId} ;`;
  const updatePlayerDetails = await db.run(updatePlayerDetailsQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchDetailsQuery = `
    SELECT 
    match_id AS matchId ,
    match ,
    year 
    FROM match_details
    WHERE match_id = ${matchId} ;`;
  const matchDetails = await db.get(matchDetailsQuery);
  response.send(matchDetails);
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const matchesOfPlayerQuery = `
    SELECT 
    match_details.match_id AS matchId ,
    match ,
    year
    FROM (match_details INNER JOIN player_match_score ON match_details.match_id = player_match_score.match_id) 
    WHERE player_match_score.player_id = ${playerId} ; `;
  const matchesOfPlayer = await db.all(matchesOfPlayerQuery);
  response.send(matchesOfPlayer);
});

app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const playersOfMatchQuery = `
    SELECT 
    player_details.player_id AS playerId ,
    player_details.player_name AS playerName
    FROM (player_details INNER JOIN player_match_score ON player_details.player_id = player_match_score.player_id)
    WHERE player_match_score.match_id = ${matchId} ;`;
  const playersOfMatch = await db.all(playersOfMatchQuery);
  response.send(playersOfMatch);
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const statisticsOfPlayerQuery = `
    SELECT 
    player_details.player_id AS playerId ,
    player_name AS playerName ,
    sum(score) AS totalScore ,
    sum(fours) AS totalFours ,
    sum(sixes) AS totalSixes
    FROM (player_match_score INNER JOIN player_details ON player_match_score.player_id = player_details.player_id)
    WHERE player_details.player_id = ${playerId} ;`;
  const statisticsOfPlayer = await db.get(statisticsOfPlayerQuery);
  response.send(statisticsOfPlayer);
});
