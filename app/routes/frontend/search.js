var express = require('express');
var router = express.Router();

const folderView	 = __path_views + 'frontend/pages';
const layoutblog = __path_views + "frontend/frontend";
const CategoryModel = require(__path_schemas + "category");
const ItemsModel = require(__path_schemas + "items");

router.post('(/:search)', async (req, res, next)=>{
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
  let searchPosts = await ItemsModel.find({name: {"$regex": req.params.search}}).exec();

  res.render(`${folderView}/search/index`, {layout: layoutblog, pageTitle: "Search", category, top_post: false, randomPosts, searchPosts})

})

module.exports = router;
