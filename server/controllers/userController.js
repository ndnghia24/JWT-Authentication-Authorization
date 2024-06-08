const User = require("../models/User");
const jwt = require("jsonwebtoken");

const userController = {
  //GET ALL USERS
  getAllUsers: async (req, res) => {
    try {
      const users = await User.find();
      res.status(200).json(users);
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  //DELETE A USER
  deleteUser: async (req, res) => {
    try {
      const user = await User.findByIdAndDelete(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // get token from header
      const token = req.header("token").split(" ")[1];
      console.log(token);
      let clearCookies = false;
  
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_ACCESS_KEY);
          console.log(decoded);
          if (decoded.id === req.params.id) {
            clearCookies = true;
          }
        } catch (error) {
          console.error("Token verification failed:", error);
        }
      }
  
      res.status(200).json({ message: "User deleted", clearCookies });
    } catch (err) {
      console.error("Error deleting user:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
};

module.exports = userController;
