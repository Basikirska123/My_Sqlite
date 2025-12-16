const MySqliteRequest = require('./my_sqlite_request');
const request = new MySqliteRequest()

// test insert
    .insert('nba_player_data.csv')
    .values({
        name: 'Test player',
        year_start: '2025',
        year_end: '2025',
        position: 'G',
        height: '6-0',
        weight: '180',
        birth_date: '2025-01-01',
        college: 'Test College'
    });
    request.run();
    console.log('Insert done.');
