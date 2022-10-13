const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');

const data = require('./db/data')

const app = express();

app.use(morgan('tiny'));
app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.json({
        message: 'Goodwill API'
    });
});
app.get('/data', (req, res) => {
        data.getAll().then((data) => {
            res.json(data);
        })

    });


const port = process.env.PORT || 2000;
app.listen(port, () => {
    console.log(`listening on ${port}`);
});
