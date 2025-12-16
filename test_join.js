const MySqliteRequest = require('./my_sqlite_request');

// test JOIN
const joinRequest = new MySqliteRequest()
    .from('nba_player_data.csv')
    .join('name', 'nba_players.csv', 'Player')
    .select(['name', 'year_start', 'birth_state'])
    .where('year_start', '1991')

console.log(joinRequest.run().slice(0, 5));