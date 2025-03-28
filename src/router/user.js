import express from "express";
import User from "../models/user.js";
import auth from "../middleware/auth.js";
import multer from "multer";
import sharp from 'sharp'
import sendWelcomeEmail from "../email/account.js";

const userRouter = new express.Router();
const upload = multer({
  dest: "avatars",
  limits: {
    fileSize: 3000000, // được tình bằng byte - 1 triệu byte = 1MB
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|png|jpeg)$/)) {
      return cb(new Error("Please upload a file image"));
    }
    cb(undefined, true);
  },
});

userRouter.post("/users", async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save();
    sendWelcomeEmail(user.name,user.email)
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (error) {
    res.status(400).send(error.message);
  }
});

userRouter.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (error) {
    res.status(400).send(error);
  }
});

userRouter.get("/users", auth, async (req, res) => {
  try {
    const users = await User.find({});
    res.send(users);
  } catch (error) {
    res.status(500).send();
  }
});

userRouter.get("/users/:id", async (req, res) => {
  try {
    const _id = req.params.id;
    const user = await User.findById(_id);

    if (!user) {
      return res.status(404).send();
    }
    res.send(user);
  } catch (error) {
    res.status(500).send();
  }
});

userRouter.patch("/users/me", async (req, res) => {
  //chuyển key từ object thành mảng chứa các tên key ví dụ : {test:123,name:test2} -> ['test','name']
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "email", "password", "age"];
  //hàm every khi chạy vòng lập nếu mà có 1 cái  false thì sẽ trả về kết quả false luôn
  const isValid = updates.every((update) => allowedUpdates.includes(update));

  if (!isValid) {
    return res.status(400).send({ error: "Invalid updates" });
  }

  try {
    updates.forEach((update) => (req.user[update] = req.body[update]));

    await req.user.save();
    // const user = await User.findByIdAndUpdate(_id,req.body,{new:true,runValidators:true})

    res.send(req.user);
  } catch (error) {
    res.status(400).send(error);
  }
});

userRouter.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });
    await req.user.save();
    res.status(200).send();
  } catch (error) {
    res.status(500).send();
  }
});

userRouter.post("/users/logOutAll", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
  } catch (error) {
    res.status(500).send();
  }
});

userRouter.delete("/users/me", auth, async (req, res) => {
  try {
    // const _id = req.params.id
    // const user = await User.findByIdAndDelete(_id)

    // if(!user){
    //     res.status(404).send()
    // }
    await req.user.remove();
    res.send(req.user);
  } catch (error) {
    res.status(500).send(error);
  }
});

userRouter.post(
  "/users/me/avatar",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({width:250,height:250}).png().toBuffer()
    res.user.avatar = buffer
    await req.user.save();
    res.status(200).send();
  },
  (error, req, res, next) => {
    res.status(400).json({ error: error.message });
  }
);

userRouter.delete("/users/me/avatar", auth, async (req, res) => {
  try {
    res.user.avatar = undefined;
    await req.user.save();
    res.send();
  } catch (error) {
    res.status(500).send(error);
  }
});

userRouter.get("/users/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.avatar) {
      throw new Error();
    }

    res.set('Content-Type','image/png')
    res.send(user.avatar)

  } catch (error) {}
});

export default userRouter;
