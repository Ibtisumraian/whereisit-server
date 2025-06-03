const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000


app.use(cors())
app.use(express.json())



app.get('/', (req, res) => {
    res.send("hello and welcome to lost and found server")
})

app.listen(port, ()=> {
    console.log(`the server is running on port ${port}`);
    
})