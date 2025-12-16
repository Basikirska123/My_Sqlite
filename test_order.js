const MySqliteRequest = require('./my_sqlite_request');

// test ORDER asc, desc
const orderRequest = new MySqliteRequest()
    .from('nba_player_data.csv')
    .select(['name', 'year_start'])
    .where('year_start', '1995')
    .order('desc', 'name');

console.log(orderRequest.run().slice(0, 10));

