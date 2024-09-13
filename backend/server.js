const express = require('express');  
const cron = require('node-cron');  
const mongoose = require('mongoose');  
const nodemailer = require('nodemailer');  
const bodyParser = require('body-parser');
require('dotenv').config();  

const app = express(); //done
app.use(bodyParser.json()); //done

const cors = require('cors');  //done
const allowedOrigins = ['http://localhost:5500','http://127.0.0.1:5500', 'https://to-do-task-roan.vercel.app'];
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.error(`Blocked by CORS: ${origin}`); // Logging blocked origins
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type'],
};
// app.use(cors(corsOptions));    //done
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));


// Connect to MongoDB
mongoose.connect(process.env.DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000, // Increase the timeout to 30 seconds
})
.then(() => {
    console.log("Mongo DB Connected Successfully");
})
.catch((err) => {
    console.error("Error connecting to MongoDB:", err.message);
});


// Task Schema and Model
const taskSchema = new mongoose.Schema({
  taskName: String,
  frequency: String,
  nextExecution: Date
});    

const logSchema = new mongoose.Schema({
  taskName: String,
  executionTime: Date,
  status: String,
  message: String
});

const Task = mongoose.model('Task', taskSchema);   //done
const Log = mongoose.model('Log', logSchema);

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
        user: process.env.EMAIL_USER,
        pass:process.env.EMAIL_PASS
    }
}); 
// Helper function to send emails
const sendEmail = async (taskName) => {
    try{await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: 'abc@gmail.com',
        subject: `Scheduled Reminder for task :- ${taskName} `,
        text: `This is a reminder email for :- ${taskName}.`
    });
    console.log("mail sent");  
    } catch (error) {
        console.error('Error sending email:', error);
    }

  
};

// Route to schedule tasks
app.post('/add-task', async (req, res) => {
    const { taskName, frequency } = req.body;
    if (typeof frequency !== 'string') {
        return res.status(400).json({ success: false, message: 'Invalid cron pattern' });
      }

  // Save task to the database
  const task = new Task({ taskName, frequency, nextExecution: new Date() });
  await task.save();

  // Schedule the task
    cron.schedule(frequency, async () => {
        console.log("hiii");
        try {
            // Check if a log entry already exists for this task
            const existingLog = await Log.findOne({ taskName });
    
            if (!existingLog) {
                // If no existing log, send the email and create the log
                await sendEmail(taskName);
                const log = new Log({
                    taskName,
                    executionTime: new Date(),
                    status: 'Success',
                    message: 'Email sent'
                });
                await log.save();
                console.log(`Task "${taskName}" executed and logged successfully.`);
            } else {
                console.log(`Log for task "${taskName}" already exists. Skipping log creation.`);
            }
        } catch (err) {
            // Check if there's no existing failure log and create one if necessary
            const existingLog = await Log.findOne({ taskName });
    
            if (!existingLog) {
                const log = new Log({
                    taskName,
                    executionTime: new Date(),
                    status: 'Failure',
                    message: err.message
                });
                await log.save();
                console.log(`Failed to execute task "${taskName}". Error logged.`);
            } else {
                console.log(`Error occurred, but log for task "${taskName}" already exists.`);
            }
        }
  });

  res.json({ success: true, nextExecution: task.nextExecution });
});

// Route to fetch task list (optional)
app.get('/tasks', async (req, res) => {
  const tasks = await Task.find();
  res.json(tasks);
});

// Route to fetch task logs (optional)
app.get('/logs', async (req, res) => {
  const logs = await Log.find();
  res.json(logs);
});

const PORT = process.env.PORT || 3000; 
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 
