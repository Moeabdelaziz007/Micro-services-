import express from 'express';

const app = express();

console.log('UI Agent initializing');

app.get('/health', (req, res) => {
    res.send('UI Agent is running');
});

app.listen(3000, () => {
    console.log('UI Agent listening on port 3000');
});
