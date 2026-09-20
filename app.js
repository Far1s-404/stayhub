const express = require ('express');
const app = express();
app.use(express.json());


const rooms = [
    {id: 1, name: "Deluxe Room", price: 100},
    {id: 2, name: "Suite Room", price: 200},
    {id: 3, name: "Standard Room", price: 50}
]

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
    .get((req, res) => {
        res.json(rooms);
    })
   .post((req, res) => {
    
    const newRoom = {
    id: rooms.length + 1, 
    name: req.body.name, 
    price: req.body.price
    }

    rooms.push(newRoom);

    res.status(201).json(rooms)
   })

   

 
app.route('/rooms/:id')
    .get((req, res) => {
        const room = rooms.find(room => room.id == req.params.id);
        if (!room) {
            return res.status(404).send("Room not found");
        }
        else {
            res.json(room);
        }
    })


    .put((req, res) => {
    const room = rooms.find(room => room.id == req.params.id);
    if (!room) {
        return res.status(404).send("Room not found");
    }
    else {
        room.name = req.body.name;
        room.price = req.body.price;
        res.json(room);
    }
   })
   .delete((req, res) => {
    const roomIndex = rooms.findIndex(room => room.id == req.params.id);
    if (roomIndex === -1) {
        return res.status(404).send("Room not found");
    }
    else {
        rooms.splice(roomIndex, 1);
        res.status(200).send("Room deleted successfully");
    }
   })




app.route('/bookings')
.get((req, res) => {
    res.json(bookings);
})



.post((req, res) => {
    const room = rooms.find(room => room.id == req.body.roomId)
    const conflict = bookings.some(booking => booking.roomId == req.body.roomId && 
        req.body.checkIn < booking.checkOut && req.body.checkOut > booking.checkIn
    )
    if (!room ){
        res.status(404).send("Room is not found")
    }
    else {
        if (!conflict){
            const newBooking = {
        id : bookings.length + 1,
        roomId: req.body.roomId,
        guestName: req.body.guestName,
        checkIn: req.body.checkIn,
        checkOut: req.body.checkOut
            }
        bookings.push(newBooking)
        return res.status(201).send("Room booked successfully")
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


