import express from "express";
import Task from "../models/taks.js";
import User from "../models/user.js";
import auth from "../middleware/auth.js";

const taskRouter = express.Router();

taskRouter.post("/tasks", auth, async (req, res) => {
  try {
    // const taks = new Task(req.body)

    const task = new Task({
      ...req.body,
      owner: req.user._id,
    });

    await task.save();
    res.status(201).send(task);
  } catch (error) {
    res.status(400).send(error);
  }
});


//filter tasks bằng query trên path
//GET /tasks?completed=true
//GET /tasks?limit=10&skip=20
//GET /tasks?sortBy=createdAt:desc
taskRouter.get("/tasks", auth, async (req, res) => {
  try {
    //cách 1
    //const tasks = await Task.find({ owner: req.user._id });

    //cách 2
    // const user = await User.findById(req.user._id).populate("tasks");

    //match này là cái mình muốn lấy dữ liệu theo key nào của object
    const match = {}
    const sort = {}

    if(req.query.completed){
      match.status = req.query.completed === 'true'
    }

    if(req.query.sortBy){
      const parts = req.query.sortBy.split(':')
      sort[parts[0]] = parts[1]
    }

    //thực hiện câu truy vấn, đã set virtual trong model user
   await req.user.populate({
      path: 'tasks',
      match,
      //phân trang
      options:{
        limit:parseInt(req.query.limit) || null,
        skip: parseInt(req.query.limit) || null,
        sort //-1 là giảm dần còn 1 là tăng dần
      }
    })

    res.send(req.user.tasks);
  } catch (error) {
    res.status(500).send();
  }
});

taskRouter.get("/tasks/:id", auth, async (req, res) => {
  try {
    const _id = req.params.id;
    // const task = await  Task.findById(_id)

    const task = await Task.findOne({ _id, owner: req.user._id });

    if (!task) {
      return res.status(404).send();
    }
    res.send(task);
  } catch (error) {
    res.status(500).send();
  }
});

taskRouter.patch("/tasks/:id", auth, async (req, res) => {
  const updatesTask = Object.keys(req.body);
  const allowedUpdates = ["description", "status"];
  const isValid = updatesTask.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValid) {
    return res.status(404).send({ error: "Invalid updates" });
  }

  try {
    const _id = req.params.id;
    // const task = await Task.findById(_id);

    const task = await Task.findOne({ _id, owner: req.user._id });

    updatesTask.forEach((updates) => (task[updates] = req.body[updates]));

    await task.save();
    // const task = await Task.findByIdAndUpdate(_id,req.body,{new:true,runValidators:true})

    if (!task) {
      return res.status(404).send();
    }

    res.send(task);
  } catch (error) {
    res.status(400).send(error);
  }
});

taskRouter.delete("/tasks/:id", auth , async (req, res) => {
  try {

    const task = await Task.findOneAndDelete({_id:req.params.id,owner:req.user._id});

    if (!task) {
      return res.status(404).send();
    }

    res.send(task);
  } catch (error) {
    res.status(500).send();
  }
});

export default taskRouter;
