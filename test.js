const MySqliteRequest = require('./my_sqlite_request');
const request = new MySqliteRequest()
    .from('nba_player_data.csv')
    .select(['name', 'college', 'year_start'])
    .where('college', 'University of Oklahoma');
console.log(request.run());
