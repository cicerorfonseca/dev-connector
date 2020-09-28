const express = require('express');

const app = express();

app.get('/', (req, res) => res.send('API Running'));

// If there is no port set on environment variables (heroku) it will use 5000
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
