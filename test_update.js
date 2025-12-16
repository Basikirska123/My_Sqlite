const MySqliteRequest = require('./my_sqlite_request');

// test update "Test player" college
const updateRequest = new MySqliteRequest()
    .update('nba_player_data.csv')
    .set({college: 'Updated Test College'})
    .where('name', 'Test player');
updateRequest.run();
console.log('Update done.');

// check it with SELECT
const selectRequest = new MySqliteRequest()
    .from('nba_player_data.csv')
    .select(['name', 'college'])
    .where('name', 'Test player')
console.log(selectRequest.run());
