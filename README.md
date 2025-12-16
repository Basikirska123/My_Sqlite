# Welcome to My Sqlite
***

## Task
The goal of this project is to build a lightweight SQLite-like engine using JavaScript.

The challenge is to:
Read and write data from CSV files;
Execute SQL-like commands (SELECT, INSERT, UPDATE, DELETE);
Support basic database features such as WHERE, JOIN, and ORDER BY;
Provide a Command Line Interface (CLI) to interact with the database.

The main difficulty is handling CSV files correctly, especially values that contain commas inside quotes.

## Description
This project implements a class called MySqliteRequest that behaves like a simplified SQLite request builder.

Key points of the solution:
Data is stored in CSV files (each CSV = one table);
Queries are built step by step using chainable methods;
The query is executed only when .run() is called;
Only one WHERE and one JOIN are allowed per request (as required by Qwasar);
CSV parsing is quote-aware (e.g. "June 24, 1968" is handled correctly);
All changes (INSERT, UPDATE, DELETE) are persisted to the CSV file;

Two main files:
my_sqlite_request.js — core logic (query builder + execution)
my_sqlite_cli.js — command line interface (SQL-like input)

## Installation
No special installation is needed. Requirements: Node.js
Make sure all files are in the same directory:
my_sqlite_request.js
my_sqlite_cli.js
nba_player_data.csv
nba_players.csv

## Usage
Start the CLI: node my_sqlite_cli.js
You should see: 
MySQLite version 0.1 20XX-XX-XX
my_sqlite_cli>

Type quit or exit to leave the program.

SELECT examples
Select all columns: SELECT * FROM nba_player_data.csv;
Select specific columns: SELECT name, college FROM nba_player_data.csv;

WHERE example: SELECT name FROM nba_player_data.csv WHERE year_start = 1991;

ORDER BY example: SELECT name, year_end FROM nba_player_data.csv ORDER BY year_end DESC;

JOIN example: SELECT name, college, Player FROM nba_player_data.csv JOIN nba_players.csv ON college = collage;

INSERT example: INSERT INTO nba_player_data.csv VALUES (Test Player,2000,2001,G,6-0,180,"January 1, 1980",Test University);

UPDATE example: UPDATE nba_player_data.csv SET college = "Updated University" WHERE name = "Test Player";

DELETE example: DELETE FROM nba_player_data.csv WHERE name = "Test Player";

### The Core Team
Team: Sandra Smalina and Inga Basikirska

<span><i>Made at <a href='https://qwasar.io'>Qwasar SV -- Software Engineering School</a></i></span>
<span><img alt='Qwasar SV -- Software Engineering School's Logo' src='https://storage.googleapis.com/qwasar-public/qwasar-logo_50x50.png' width='20px' /></span>
