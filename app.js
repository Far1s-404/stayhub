const express = require ('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();
app.use(express.json());

const pool = require('./db');


app.route('/rooms')
    .get(async (req, res) => {
        const room = await pool.query('SELECT * FROM rooms');
        res.json(room.rows);
    })
   .post(async (req, res) => {

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


    .put(async (req, res) => {
    const room = await pool.query('UPDATE rooms SET name = $1, price =$2 WHERE id = $3 RETURNING *',[req.body.name, req.body.price, req.params.id]);
    if (room.rows.length == 0) {
        return res.status(404).send("Room not found");
    }
    else {
        res.json(room.rows[0]);
    }
   })
   .delete(async (req, res) => {
    const room = await pool.query('DELETE FROM rooms WHERE id = $1 RETURNING *', [req.params.id]);
    if (room.rows.length == 0) {
        return res.status(404).send("Room not found");
    }
    else {
        res.status(200).send("Room deleted successfully");
    }
   })




app.route('/bookings')
.get(async(req, res) => {
    const bookings = await pool.query('SELECT * FROM bookings');
    res.json(bookings.rows);
})



.post(async(req, res) => {
    const room = await pool.query ('SELECT * FROM rooms where id = $1', [req.body.roomId]);
    const conflict = await pool.query('SELECT * FROM bookings WHERE room_id = $1 AND check_in < $3 AND check_out > $2',
         [req.body.roomId, req.body.checkIn, req.body.checkOut]
    )
    if (room.rows.length == 0){
        return res.status(404).send("Room is not found")
    }
    else {
        if (conflict.rows.length == 0){
            const newBooking = await pool.query('INSERT INTO bookings (user_id,room_id,check_in,check_out) VALUES ($1,$2,$3,$4) RETURNING *', [req.body.userId, req.body.roomId, req.body.checkIn, req.body.checkOut]);
            return res.status(201).json(newBooking.rows[0]);
        } 
       
        else {
            return res.status(400).send("Room is already booked for the selected dates")
        }

    }
    
    
        }
)
    
app.route('/bookings/:id')
.get(async (req, res) => 
    {
const booking = await pool.query('SELECT * FROM bookings WHERE id = $1', [req.params.id]);
if (booking.rows.length == 0){
    return res.status(404).send("Booking not found");
}
else {
    return res.json(booking.rows[0]);
    }
    })
.put(async (req, res) => {
    const booking = await pool.query('SELECT * FROM bookings WHERE id = $1', [req.params.id]);
    if (booking.rows.length == 0){
        return res.status(404).send("Booking not found");
    }
    else {
        const conflict = await pool.query('SELECT * FROM bookings WHERE room_id = $1 AND check_in < $3 AND check_out > $2 AND id != $4' , [req.body.roomId, req.body.checkIn, req.body.checkOut, req.params.id]
    )
        if (conflict.rows.length == 0){
            const updateBooking = await pool.query('UPDATE bookings SET user_id = $1 , room_id = $2 , check_in = $3 , check_out = $4 WHERE id = $5 RETURNING *', [req.body.userId, req.body.roomId, req.body.checkIn, req.body.checkOut, req.params.id]);
            return res.json(updateBooking.rows[0]);
        }
        else {
            return res.status(400).send("Room is already booked for the selected dates")
        }
    }
    })    
.delete(async (req, res) => {
    const booking = await pool.query('SELECT * FROM bookings WHERE id = $1', [req.params.id]); 
    if (booking.rows.length == 0){
        return res.status(404).send("Booking not found");
    }
    else {
        await pool.query('DELETE FROM bookings WHERE id = $1', [req.params.id]);
        return res.status(200).send("Booking deleted successfully");
    }


        
    })


//==============password hashing ==============

app.post('/users/register', async(req, res) => {
    const name = req.body.name
    const email = req.body.email
    const password = req.body.password
    
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password,saltRounds)

    const user = await pool.query('INSERT INTO users (name, email, password) VALUES ($1,$2,$3) RETURNING *', [name , email, hashedPassword])
    const newUser = {
        id : user.rows[0].id,
        name : user.rows[0].name,
        email : user.rows[0].email
    }
    return res.status(201).send(newUser)

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





    app.listen(3000, () => {
    console.log('stayhub is running on port 3000');
})



