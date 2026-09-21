const express = require ('express');
const app = express();
app.use(express.json());

const pool = require('./db');



const bookings = [
    {
        id: 1,
        roomId: 2,
        guestName: "Faris",
        checkIn: "2026-10-01",
        checkOut: "2026-10-05"
    }
];


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
.get((req, res) => 
    {
const booking = bookings.find(booking => booking.id == req.params.id);
if (!booking){
    return res.status(404).send("Booking not found");
}
else {
    return res.json(booking);
    }
    })
.put((req, res) => {
    const booking = bookings.find(booking => booking.id == req.params.id);
    if (!booking){
        return res.status(404).send("Booking not found");
    }
    else {
        const conflict = bookings.some(booking => booking.id != req.params.id && booking.roomId == req.body.roomId && 
        req.body.checkIn < booking.checkOut && req.body.checkOut > booking.checkIn
    )
        if (!conflict){
            booking.roomId = req.body.roomId;
            booking.guestName = req.body.guestName;
            booking.checkIn = req.body.checkIn;
            booking.checkOut = req.body.checkOut;
            return res.json(booking);
            
        }
        else {
            return res.status(400).send("Room is already booked for the selected dates")
        }
    }
    })    
.delete((req, res) => {
    const bookingIndex = bookings.findIndex(booking => booking.id == req.params.id);
    if (bookingIndex == -1){
        return res.status(404).send("Booking not found");
    }
    else {
        bookings.splice(bookingIndex,1);
        return res.status(200).send("Booking deleted successfully");
    }


        
    })


   app.listen(3000, () => {
    console.log('stayhub is running on port 3000');
})

