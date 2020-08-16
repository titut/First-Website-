var express = require('express');
var router = express.Router();

const folderView	 = __path_views + 'frontend/pages';
const layoutblog = __path_views + "frontend/frontend";
const CategoryModel = require(__path_schemas + "category");
const ItemsModel = require(__path_schemas + "items");

router.get('(/:id)', async (req,res,next)=>{
    let category = await CategoryModel.find({}).exec();
    let posts = await ItemsModel.find({}).exec();
    let randomArr = [];
    let randomPosts = [];
    while(randomArr.length < 4){
        let number = Math.floor(Math.random() * posts.length);
        if(!randomArr.includes(number)){
        randomArr.push(number);
        }
    }
    for(let index of randomArr){
        randomPosts.push(posts[index]);
    }
    let thePost = await ItemsModel.findOne({_id: req.params.id}).exec();

    res.render(`${folderView}/post/index`, {layout: layoutblog, pageTitle: "HELLO WORLD", top_post: false, category, randomPosts, thePost});
})

module.exports = router;