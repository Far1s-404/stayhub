const express = require ('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();
app.use(express.json());

const pool = require('./db');


function authenticateToken(req, res, next) {
    let authHeader = req.headers['authorization']
    if (!authHeader){
        return res.status(401).send('Unauthorized access')
    }
    else {
        authHeader = authHeader.split(' ')[1]
        jwt.verify(authHeader, "secret-key", (err, decoded) => {
            if (err) {
                return res.status(401).send('Unauthorized access');
            }
            req.user=decoded
            next()
        });
    }
}




app.route('/rooms')
    .get(async (req, res) => {
            const room = await pool.query('SELECT * FROM rooms');
            res.json(room.rows);  
    })
   .post(async (req, res) => {
    if(!req.body.name){
        return res.status(400).send("Room name is required")
    }
    if (typeof req.body.name != 'string'){
        return res.status(400).send('Invalid room name')
    }
    
    if (req.body.name.trim().length < 3 || req.body.name.trim().length > 50){
        return res.status(400).send('Room name must be between 3 and 50 characters')
    }
    
    if(!req.body.price){
        return res.status(400).send("Room price is required")
    }   
    if(req.body.price <= 0){
        return res.status(400).send('Invalid room price')
    }
    if (typeof req.body.price != "number"){
        return res.status(400).send('Room price must be a valid number')
    }
    const room = await pool.query('INSERT INTO rooms (name, price) VALUES ($1, $2) RETURNING *', [req.body.name, req.body.price]);
    res.status(201).json(room.rows[0]);
   })

   

 
app.route('/rooms/:id')
    .get(async (req, res) => {
        const room = await pool.query('SELECT * FROM rooms where id = $1', [req.params.id]);
        if (room.rows.length == 0) {
            return res.status(404).send("Room not found");
        }
        else {
            res.json(room.rows[0])
        }
    })


    .put(authenticateToken, async (req, res) => {
        
        if (!req.body.name) {
            return res.status(400).send("Room name is required");
        }
        
        if (typeof req.body.name != "string") {
            return res.status(400).send("Invalid room name");
        }
        
        if (req.body.name.trim().length < 3 || req.body.name.trim().length > 50){
            return res.status(400).send('Room name must be between 3 and 50 characters')
        }
        
        if (!req.body.price) {
            return res.status(400).send("Room price is required");
        }
        
        if (typeof req.body.price != "number") {
            return res.status(400).send("Room price must be a valid number");
        }
        
        if (req.body.price <= 0) {
            return res.status(400).send("Invalid room price");
        }
        
        
    const room = await pool.query('UPDATE rooms SET name = $1, price =$2 WHERE id = $3 RETURNING *',[req.body.name, req.body.price, req.params.id]);
    if (room.rows.length == 0) {
            return res.status(404).send("Room not found");
        }
    res.json(room.rows[0]);

   })
   .delete(authenticateToken, async (req, res) => {
    const room = await pool.query('DELETE FROM rooms WHERE id = $1 RETURNING *', [req.params.id]);
    if (room.rows.length == 0) {
        return res.status(404).send("Room not found");
    }
    else {
        res.status(200).send("Room deleted successfully");
    }
   })




app.route('/bookings')
.get(authenticateToken, async(req, res) => {
   const bookings = await pool.query('SELECT * FROM bookings WHERE user_id = $1', [req.user.userId]);
    return res.json(bookings.rows);
    
})



.post(authenticateToken, async(req, res) => {
    
    if (!req.body.roomId) {
        return res.status(400).send("Room ID is required");
    }
    if (isNaN(req.body.roomId)) {
        return res.status(400).send("Room ID must be a number");
    }
    if (!req.body.checkIn) {
        return res.status(400).send("Check-in date is required");
    }
    if (!req.body.checkOut) {
        return res.status(400).send("Check-out date is required");
    }
    if (isNaN(Date.parse(req.body.checkIn)) || isNaN(Date.parse(req.body.checkOut))) {
        return res.status(400).send("Invalid check-in or check-out date");
    }
    if (new Date(req.body.checkIn) >= new Date(req.body.checkOut)) {
        return res.status(400).send("Check-out date must be after check-in date");
    }

    
    const room = await pool.query ('SELECT * FROM rooms where id = $1', [req.body.roomId]);
    
    if (room.rows.length == 0){
        return res.status(404).send("Room is not found")
    }
   
    const conflict = await pool.query('SELECT * FROM bookings WHERE room_id = $1 AND check_in < $3 AND check_out > $2',
         [req.body.roomId, req.body.checkIn, req.body.checkOut]
    )
        
    if (conflict.rows.length == 0){
            const newBooking = await pool.query('INSERT INTO bookings (user_id,room_id,check_in,check_out) VALUES ($1,$2,$3,$4) RETURNING *', [req.user.userId, req.body.roomId, req.body.checkIn, req.body.checkOut]);
            return res.status(201).json(newBooking.rows[0]);
        } 
       
        else {
            return res.status(400).send("Room is already booked for the selected dates")
        }

    }
    
    
    
)
    
app.route('/bookings/:id')
.get(authenticateToken, async (req, res) => {  

if (!req.params.id) {
    return res.status(400).send("Booking ID is required");
}
if (isNaN(req.params.id)) {
    return res.status(400).send("Booking ID must be a number");
}


const booking = await pool.query('SELECT * FROM bookings WHERE id = $1 AND user_id=$2', [req.params.id ,req.user.userId]);
if (booking.rows.length == 0){
    return res.status(404).send("Booking not found");
}

return res.json(booking.rows[0]);
    
})
.put(authenticateToken, async (req, res) => {
    
    if (!req.body.checkIn || !req.body.checkOut || !req.body.roomId) {
        return res.status(400).send("All fields are required");
    }
   if (isNaN(Date.parse(req.body.checkIn)) || isNaN(Date.parse(req.body.checkOut))) {
        return res.status(400).send("Check-in and check-out dates must be valid dates");
    }
    if (new Date(req.body.checkIn) >=  new Date(req.body.checkOut)) {
        return res.status(400).send("Check-out date must be after check-in date");
    }    
    if (isNaN(req.body.roomId)) {
        return res.status(400).send("Room ID must be a number");
    }

    const room = await pool.query('SELECT * FROM rooms WHERE id = $1', [req.body.roomId]);
    if (room.rows.length == 0) {
        return res.status(404).send("Room not found");
    }




    const booking = await pool.query('SELECT * FROM bookings WHERE id = $1 AND user_id=$2', [req.params.id ,req.user.userId]);
    if (booking.rows.length == 0){
        return res.status(404).send("Booking not found");
    }
    else {
        const conflict = await pool.query('SELECT * FROM bookings WHERE room_id = $1 AND check_in < $3 AND check_out > $2 AND id != $4' , [req.body.roomId, req.body.checkIn, req.body.checkOut, req.params.id]
    )
        if (conflict.rows.length == 0){
            const updateBooking = await pool.query('UPDATE bookings SET user_id = $1 , room_id = $2 , check_in = $3 , check_out = $4 WHERE id = $5 RETURNING *', [req.user.userId, req.body.roomId, req.body.checkIn, req.body.checkOut, req.params.id]);
            return res.json(updateBooking.rows[0]);
        }
        else {
            return res.status(400).send("Room is already booked for the selected dates")
        }
    }
    })    
.delete(authenticateToken, async (req, res) => {
    const booking = await pool.query('SELECT * FROM bookings WHERE id = $1 AND user_id = $2 ', [req.params.id, req.user.userId]); 
    if (booking.rows.length == 0){
        return res.status(404).send("Booking not found");
    }
    else {
        await pool.query('DELETE FROM bookings WHERE id = $1', [req.params.id]);
        return res.status(200).send("Booking deleted successfully"  );
    }


        
    })

    
    //==============password hashing ==============
    
    app.post('/users/register', async(req, res) => {
        const name = req.body.name
        const email = req.body.email
        const password = req.body.password
        
        //type checking and null checking
        if (typeof email != 'string'){
            return res.status(400).send('Invalid email')
        }
        if (typeof password != 'string'){
            return res.status(400).send('Invalid password')
        }
        if (typeof name != 'string'){
            return res.status(400).send('Invalid name')
        }
        if (email == null || email == undefined || email.trim() == ""){
            return res.status(400).send("Email is required")
        }
        if (password == null || password == undefined || password.trim() == ""){
            return res.status(400).send("Password is required")
        }
        if (name == null || name == undefined || name.trim() == ""){
            return res.status(400).send("Name is required")
        }
        
//name length checking
    if (name.length < 3 || name.length > 50) {
        return res.status(400).send("Name must be between 3 and 50 characters long");
    }
//email format checking
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).send("Invalid email format");
    }

//password length checking
    if (password.length < 8) {
        return res.status(400).send("Password must be at least 8 characters long");
    }



    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password,saltRounds)
    try {
        const user = await pool.query('INSERT INTO users (name, email, password) VALUES ($1,$2,$3) RETURNING *', [name , email, hashedPassword])
        const newUser = {
        id : user.rows[0].id,
        name : user.rows[0].name,
        email : user.rows[0].email
    }
    return res.status(201).json(newUser);
    }catch (error) {
    //error handling for duplicate email
    if (error.code === '23505') {
        return res.status(409).send("Email already exists");
    } else {
        console.error(error);   
        return res.status(500).send("Internal server error");
    }
}
})

app.post('/users/login', async(req, res) => {
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [req.body.email])
    if (user.rows.length == 0) {
        return res.status(401).send('Email or Password incorrect')
    }
    else {
        const isMatch = await bcrypt.compare(req.body.password, user.rows[0].password)
        if(isMatch) {
            const token = jwt.sign(
                {userId : user.rows[0].id},
                "secret-key"
            );
            
            
            return res.status(200).json({
                message : "logged in successfully",
                token : token
            })
        }
        else {
            return res.status(401).send('Email or Password incorrect')
        }
    }
    
})





app.get('/users/me' ,authenticateToken, (req, res) => {
    res.json({
        userId: req.user.userId
    })
})



app.get('/test', (req, res, next) => {
    const error = new Error("something went wrong") 
    next(error)
})



app.use((error,req,res,next) => {
    console.log(`ERROR: ${error}`)
    res.status(500).send('test error')
})






    app.listen(3000, () => {
    console.log('stayhub is running on port 3000');
})
