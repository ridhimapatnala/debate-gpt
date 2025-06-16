const User = require('../models/User');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');

const JWT_SECRET=process.env.JWT_SECRET;

const register=async(req, res)=>{
    try{
        const {email, password}=req.body;
        if(!email || !password){
            return res.status(409).json({
                error:'Email & Password required'
            })
        }

        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(409).json({
                error:'Email already exists'
            })
        }

        const hashedPassword=await bcrypt.hash(password, 10);
        const user=await User.create({email, password: hashedPassword})
        const token = jwt.sign({id:user._id, email:user.email}, JWT_SECRET, { expiresIn: '7d' });
        res.json({ user: { id: user._id, email: user.email }, token });
    }catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
}

const login = async (req, res) => {
    try{
        const {email, password}=req.body;
        if(!email || !password){
            return res.status(409).json({
                error:'Email & Password required'
            })
        }
        const existingUser = await User.findOne({email});
        if(!existingUser){
            return res.status(409).json({
                error:'Email does not exist'
            })
        }
        const match=await bcrypt.compare(password, existingUser.password);
        if(!match){
            return res.status(401).json({
                error:'Invalid email or password'
            })
        }
        const token = jwt.sign({ id: existingUser._id, email: existingUser.email }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ user: { id: existingUser._id, email: existingUser.email }, token });


    }catch(err){
        console.error(err);
        res.status(500).json({error:'Login failed'})
    }
}

module.exports={register, login}