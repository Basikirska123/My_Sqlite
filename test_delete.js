const MySqliteRequest = require('./my_sqlite_request');

// test before DELETE is there "Test player"
const before = new MySqliteRequest()
    .from('nba_player_data.csv')
    .select(['name', 'college'])
    .where('name', 'Test player')
    .run();

console.log('Before DELETE:', before);

// DELETE
const deleteRequest = new MySqliteRequest()
    .from('nba_player_data.csv')
    .delete()
    .where('name', 'Test player')
deleteRequest.run();
console.log('DELETE done.');

// test after DELETE
const after = new MySqliteRequest()
    .from('nba_player_data.csv')
    .select(['name', 'college'])
    .where('name', 'Test player')
    .run();
deleteRequest.run();
console.log('After DELETE.', after);
